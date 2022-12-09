// Adapted from https://github.com/AlaSQL/alasql/blob/develop/lib/xml-parser/index.js
function parse(xml) {
  xml = xml.trim();

  // strip comments
  xml = xml.replace(/<!--[\s\S]*?-->/g, '');

  return tag();

  function tag() {
    var m = match(/^<([\w-:.]+)\s*/);
    if (!m) return;

    // name
    var node = {
      name: m[1],
      attributes: {},
      children: []
    };

    // attributes
    while (!(eos() || is('>') || is('?>') || is('/>'))) {
      var attr = attribute();
      if (!attr) return node;
      node.attributes[attr.name] = attr.value;
    }

    // self closing tag
    if (match(/^\s*\/>\s*/)) {
      return node;
    }

    match(/\??>\s*/);

    // content
    node.content = content();

    // children
    var child;
    while (child = tag()) {
      node.children.push(child);
    }

    // closing
    match(/^<\/[\w-:.]+>\s*/);
    
    console.log(xml);
    return node;
  }

  function content() {
    var m = match(/^([^<]*)/);
    if (m) return m[1];
    return '';
  }

  function attribute() {
    var m = match(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|\w+)\s*/);
    if (!m) return;
    return { name: m[1], value: strip(m[2]) }
  }

  function strip(val) {
    return val.replace(/^['"]|['"]$/g, '');
  }

  function match(re) {
    var m = xml.match(re);
    if (!m) return;
    xml = xml.slice(m[0].length);
    return m;
  }

  function eos() {
    return 0 == xml.length;
  }

  function is(prefix) {
    return 0 == xml.indexOf(prefix);
  }
}

console.log(parse("<a><hi id='lol'> poggers </hi> <yes/></ta>"))
