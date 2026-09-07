#!/usr/bin/env node

var fmt = require('util').format;
var https = require('https');
var qs = require('querystring');

// Two ways to authenticate, in order of preference:
//
//   CF_API_TOKEN         a scoped API token, sent as `Authorization: Bearer`.
//                        Create it with Zone:Read + DNS:Read and nothing else.
//                        To cover client accounts too, scope its resources to
//                        "All zones from all accounts".
//   CF_EMAIL + CF_TOKEN  the legacy Global API Key. It grants full control of
//                        the entire account — every zone, SSL, billing — so
//                        prefer a scoped token wherever you can.
// Piping into `head` or `less` closes stdout early. Without this, the writes
// still in flight raise EPIPE and the tool dies with a stack trace and a
// non-zero exit — which, since a non-zero exit here means "the backup failed",
// would be a false alarm.
process.stdout.on('error', function(err) {
  if (err.code === 'EPIPE') {
    process.exit(0);
  }
  throw err;
});

var apiToken = process.env.CF_API_TOKEN;
var email = process.env.CF_EMAIL;
var token = process.env.CF_TOKEN;

var authHeaders;
if (apiToken) {
  authHeaders = { 'Authorization': 'Bearer ' + apiToken };
} else if (email && token) {
  authHeaders = { 'X-Auth-Email': email, 'X-Auth-Key': token };
} else {
  console.error('Set CF_API_TOKEN (a scoped API token with Zone:Read and DNS:Read),');
  console.error('or CF_EMAIL and CF_TOKEN for the legacy Global API Key.');
  return process.exit(1);
}

getZones(function(err, zones) {
  if (err) {
    return fail('Error listing zones', err);
  }
  if (!zones.length) {
    return fail('No zones returned', new Error('the credential can see nothing to back up'));
  }

  // /zones spans every account the credential can reach, so group by account
  // and sort. Stable ordering makes two backups diffable, which is how you spot
  // what changed between one night and the next.
  zones.sort(function(a, b) {
    var accA = accountName(a), accB = accountName(b);
    if (accA !== accB) return accA < accB ? -1 : 1;
    return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
  });

  dumpNext(0);

  // One zone at a time. Slower than firing every request at once, but the
  // output keeps the order above instead of arriving as responses happen.
  function dumpNext(i) {
    if (i >= zones.length) {
      return;
    }
    dumpZone(zones[i], function() {
      dumpNext(i + 1);
    });
  }
});

// Exit non-zero and say why, on stderr. A backup that failed must never look
// like a backup that found nothing: whoever runs this (cron, a wrapper script)
// is the only witness, and it only sees the exit code and stderr.
function fail(context, err) {
  console.error('%s: %s', context, err && err.message ? err.message : err);
  process.exitCode = 1;
}

function accountName(zone) {
  return (zone.account && zone.account.name) || 'unknown-account';
}

function dumpZone(zone, done) {
  allPages('/zones/' + zone.id + '/dns_records', function(err, recs) {
    if (err) {
      fail(fmt('Error getting records for zone %s', zone.name), err);
      return done();
    }
    console.log(';; Account: %s', accountName(zone));
    console.log(';; Domain: %s', zone.name);
    console.log(';; Exported: %s', new Date());
    console.log('$ORIGIN %s.', zone.name);
    recs.forEach(function(rec) {
      console.log(bindFormat(rec));
    });
    console.log('\n');
    done();
  });
}

// https://developers.cloudflare.com/dns/manage-dns-records/how-to/import-and-export/#dns-record-attributes
function bindFormat(rec) {
  var content = rec.content;
  switch(rec.type) {
    case 'SPF':
    case 'TXT':
      // CloudFlare already returns TXT content quoted, and splits values longer
      // than 255 chars into several quoted chunks ("part one" "part two").
      // Quoting that again nests the quotes, so the exported record carries
      // literal quote characters and restores wrong — which for SPF, DKIM and
      // DMARC means mail breaks. Only quote what arrives unquoted.
      if (!/^".*"$/.test(content)) {
        content = JSON.stringify(content);
      }
      break;
    case 'CNAME':
      content += '.';
      break;
    case 'MX':
      content = fmt('%d\t%s.', rec.priority, content);
      break;
  }
  if (rec.comment != null){
    return fmt('%s.\t%d\tIN\t%s\t%s ; %s', rec.name, rec.ttl, rec.type, content, rec.comment);
  }
  return fmt('%s.\t%d\tIN\t%s\t%s', rec.name, rec.ttl, rec.type, content);
}

function getZones(callback) {
  allPages('/zones', function(err, res) {
    callback(err, res);
  });
}

function allPages(path, callback) {
  var collection = [];
  return getPage(1);

  function getPage(page) {
    var params = {
      per_page: 50,
      page: page,
    };

    cfReq(path, params, function handlePage(err, res) {
      if (err) {
        return callback(err);
      }
      if (res.result) {
        collection = collection.concat(res.result);
      }
      if (hasMorePages(res.result_info)) {
        return getPage(res.result_info.page + 1);
      } else {
        return callback(err, collection);
      }
    });
  }
}

function hasMorePages(info) {
  if (!info) {
    return false;
  }
  var seen = (info.page - 1) * info.per_page + info.count;
  return seen < info.total_count;
}

function cfReq(path, params, callback) {
  var headers = { 'User-Agent': 'cloudflare-backup' };
  Object.keys(authHeaders).forEach(function(k) {
    headers[k] = authHeaders[k];
  });

  var opts = {
    host: 'api.cloudflare.com',
    port: 443,
    path: '/client/v4' + path + '?' + qs.stringify(params),
    headers: headers,
    method: 'GET',
  };
  var req = https.request(opts, function(res) {
    return JSONResponse(res, callback);
  });
  req.on('error', callback);
  req.end();
  return req;
}

function JSONResponse(res, callback) {
  var body = '';

  res.on('data', accumulate)
     .on('end', parse)
     .on('error', callback);

  function accumulate(buf) {
    body += buf;
  }

  function parse() {
    var parsed;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      return callback(new Error(fmt('HTTP %d, unparseable response: %s', res.statusCode, body.slice(0, 200))));
    }

    // Without these two checks a rejected credential yields an empty result set
    // and the tool exits 0, writing an empty backup file that looks fine.
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return callback(new Error(fmt('HTTP %d — %s', res.statusCode, apiErrors(parsed))));
    }
    if (parsed.success === false) {
      return callback(new Error(apiErrors(parsed)));
    }

    callback(null, parsed);
  }
}

function apiErrors(parsed) {
  if (parsed && Array.isArray(parsed.errors) && parsed.errors.length) {
    return parsed.errors.map(function(e) {
      return fmt('%s (code %s)', e.message, e.code);
    }).join('; ');
  }
  return 'no error detail returned';
}
