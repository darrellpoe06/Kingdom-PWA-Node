// "Pull my passwords in" — every export format we name is read by its HEADER,
// never by file name; what we do not list is kept, not lost; duplicates are
// found by site + username; an encrypted Bitwarden export is refused with the
// way forward. (DR-0762)
import { describe, it, expect } from 'vitest';
import { parseCsv, detectFormat, importText, parseBitwardenJson, dedupeKey, planImport, toCsv } from '../lib/vault-import.js';

describe('parseCsv', () => {
  it('handles quotes, doubled quotes, commas and newlines inside quotes, CRLF and a BOM', () => {
    const text = '﻿name,url,username,password,note\r\n"Bank, The",https://bank.example,d,"p""w","line1\nline2"\r\nSite,https://s.example,u,p,\r\n';
    const rows = parseCsv(text);
    expect(rows).toEqual([
      ['name', 'url', 'username', 'password', 'note'],
      ['Bank, The', 'https://bank.example', 'd', 'p"w', 'line1\nline2'],
      ['Site', 'https://s.example', 'u', 'p', ''],
    ]);
  });
  it('drops fully empty lines', () => {
    expect(parseCsv('a,b\n\n1,2\n')).toEqual([['a', 'b'], ['1', '2']]);
  });
});

describe('detectFormat by header', () => {
  it.each([
    [['name', 'url', 'username', 'password', 'note'], 'chrome'],
    [['url', 'username', 'password', 'httpRealm', 'formActionOrigin', 'guid', 'timeCreated', 'timeLastUsed', 'timePasswordChanged'], 'firefox'],
    [['folder', 'favorite', 'type', 'name', 'notes', 'fields', 'reprompt', 'login_uri', 'login_username', 'login_password', 'login_totp'], 'bitwarden'],
    [['Title', 'Url', 'Username', 'Password', 'Notes', 'OTPAuth'], 'onepassword'],
    [['url', 'username', 'password', 'totp', 'extra', 'name', 'grouping', 'fav'], 'lastpass'],
    [['Group', 'Title', 'Username', 'Password', 'URL', 'Notes', 'TOTP', 'Icon'], 'keepass'],
    [['username', 'username2', 'username3', 'title', 'password', 'note', 'url', 'category', 'otpSecret'], 'dashlane'],
    [['site', 'login', 'password'], 'generic'],
  ])('%j -> %s', (header, id) => {
    expect(detectFormat(header).id).toBe(id);
  });
  it('a header with no password column is not an import', () => {
    expect(detectFormat(['name', 'email'])).toBeNull();
  });
});

describe('importText shapes each export into vault items', () => {
  it('Chrome', () => {
    const r = importText('name,url,username,password,note\nBank,https://bank.example/login,darrell,s3cret,main account\n');
    expect(r.format).toBe('chrome');
    expect(r.items).toEqual([{ name: 'Bank', url: 'https://bank.example/login', username: 'darrell', password: 's3cret', notes: 'main account', totp: '', favorite: false }]);
  });
  it('Firefox has no name column: the host becomes the name', () => {
    const r = importText('url,username,password,httpRealm,formActionOrigin,guid,timeCreated,timeLastUsed,timePasswordChanged\nhttps://www.shop.example,u,p,,,{x},1,2,3\n');
    expect(r.format).toBe('firefox');
    expect(r.items[0].name).toBe('shop.example');
    expect(r.items[0].password).toBe('p');
  });
  it('Bitwarden CSV keeps logins, skips cards and notes, reads favorite and totp', () => {
    const csv = 'folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp\n'
      + ',1,login,Mail,,,0,https://mail.example,me@x,pw1,otpauth://totp/x\n'
      + ',,card,Visa,,,0,,,,\n'
      + ',,note,Secret note,body,,0,,,,\n';
    const r = importText(csv);
    expect(r.format).toBe('bitwarden');
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toMatchObject({ name: 'Mail', username: 'me@x', password: 'pw1', totp: 'otpauth://totp/x', favorite: true });
    expect(r.skipped).toBe(2);
  });
  it('1Password and LastPass and KeePass', () => {
    expect(importText('Title,Url,Username,Password,Notes,OTPAuth\nA,https://a.example,u,p,n,\n').items[0]).toMatchObject({ name: 'A', password: 'p', notes: 'n' });
    expect(importText('url,username,password,totp,extra,name,grouping,fav\nhttps://l.example,u,p,,extra note,L,Work,1\n').items[0]).toMatchObject({ name: 'L', notes: 'extra note', favorite: true });
    expect(importText('"Group","Title","Username","Password","URL","Notes","TOTP"\n"Root","K","u","p","https://k.example","","")\n').items[0]).toMatchObject({ name: 'K', url: 'https://k.example' });
  });
  it('Bitwarden JSON: logins only; an encrypted export is refused with the way forward', () => {
    const json = JSON.stringify({ encrypted: false, items: [
      { type: 1, name: 'J', notes: 'n', favorite: true, login: { uris: [{ uri: 'https://j.example' }], username: 'u', password: 'p', totp: 't' } },
      { type: 3, name: 'card' },
    ] });
    const r = importText(json);
    expect(r.format).toBe('bitwarden-json');
    expect(r.items).toEqual([{ name: 'J', url: 'https://j.example', username: 'u', password: 'p', notes: 'n', totp: 't', favorite: true }]);
    expect(r.skipped).toBe(1);
    const enc = parseBitwardenJson(JSON.stringify({ encrypted: true, items: [] }));
    expect(enc.error).toMatch(/Export it unencrypted/);
    expect(importText('{"not":"bitwarden"}').error).toMatch(/not a Bitwarden export/);
  });
  it('an unreadable file says so, naming the columns it saw', () => {
    const r = importText('first,last\nA,B\n');
    expect(r.format).toBeNull();
    expect(r.error).toMatch(/Could not recognise the columns \(first, last\)/);
    expect(importText('').error).toMatch(/no rows|not a CSV/);
  });
});

describe('dedupe and plan', () => {
  it('the key is host + username, case-folded, www dropped', () => {
    expect(dedupeKey({ url: 'https://www.Bank.example/x', username: 'D' })).toBe('bank.example|d');
    expect(dedupeKey({ name: 'Local thing', username: '' })).toBe('local thing|');
  });
  it('planImport splits new from already-present, including repeats inside the file', () => {
    const existing = [{ url: 'https://bank.example', username: 'd' }];
    const incoming = [
      { url: 'https://www.bank.example/login', username: 'D' }, // present
      { url: 'https://new.example', username: 'd' },           // new
      { url: 'https://new.example/', username: 'd' },          // repeat in file
    ];
    const p = planImport(existing, incoming);
    expect(p.added).toHaveLength(1);
    expect(p.duplicates).toHaveLength(2);
  });
  it('toCsv escapes what needs escaping and round-trips through parseCsv', () => {
    const items = [{ name: 'Bank, The', url: 'https://b', username: 'd', password: 'p"w', notes: 'two\nlines', totp: '' }];
    const rows = parseCsv(toCsv(items));
    expect(rows[0]).toEqual(['name', 'url', 'username', 'password', 'notes', 'totp']);
    expect(rows[1]).toEqual(['Bank, The', 'https://b', 'd', 'p"w', 'two\nlines', '']);
  });
});
