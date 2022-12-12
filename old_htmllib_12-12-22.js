import { readFileSync as read, existsSync as exists, readdirSync as readdir } from "fs";
import { performance } from "perf_hooks";
import { parse } from "@vue/compiler-dom"

const paths = {
  pub: "./public/",
  tmpl: "./public/template.html",
  ind: "./public/index.html",
};
let tmpl;

// Loads in the name of components so we can sub them in later
const compkey = {}; // Key that defines component paths
const readcomponents = (dir = "") => readdir("./components/" + dir, { withFileTypes: true })
  .map(file => file.isFile() ? (dir ? dir.slice(1) + "-" : "") + file.name.slice(0, file.name.lastIndexOf('.')) : readcomponents(dir + "/" + file.name).map(f => (compkey[(dir ? dir.slice(1) + "-" : "") + f] = (dir ? dir + "/" : "") + file.name + "/" + f.slice(file.name.length + 1), (dir ? dir.slice(1) + "-" : "") + f)));
const components = readcomponents().flat(10);
console.log("Components loaded in: ", components, compkey);


// removes a part of a string
const remove = (str, start, end) => str.slice(0, start) + str.slice(end + 1);

const jstml = `
const get = (str, tmp) => (tmp = str[0], str = str.slice(1), str.includes(" ") ? // 1
  (tmp === "#" ? // 2
    document.getElementById(str) : // 2
    (tmp === "." ? // 3
      document.getElementsByClassName(str) : // 3
      document.getElementsByTagName(str))) : // 1
  document.querySelector(tmp + str);
`;

// Resolvers for certain file types
const resolvers = {
  html(file) {
    
    // If the file is just "/path.html\n...", redirect instead of render
    let f = read(file).toString("utf8");
    if (f.startsWith("/"))
      return get(f.includes("\n") ? f.slice(0, f.indexOf("\n")) : f);
    
    let start = performance.now();
    
    // Apply template
    if(!tmpl) // easy template refresh switch (ctrl + /)
    tmpl = read(paths.tmpl).toString("utf8");
    f = tmpl.replace("<slot/>", f);
    
    // Components pass
    let scripts = jstml;
    let rendercomponent = i => {
      // Makes sure the component even needs to be rendered
      let comp = f.indexOf(i);
      if(comp === -1) return;
      
      // Reads the component code in after making sure it's needed
      let ccode = read("./components/" + (compkey[i] || i) + ".html").toString("utf8");
      
      // Substitutes in arguments
      let inds = [], args, ind;
      while ((inds[inds.length] = f.indexOf("<" + i, inds[inds.length - 1] + 1)) > -1); // Finds all component usages
      inds.pop();
      if(inds.length) {
        
        // Gets the arguments for each invocation
        args = inds.map(a => f.slice(a + i.length + 1, f.indexOf("/>", a + i.length)));
        
        ind = 0;
        for(let j of args) {
          let state, str = '', name, arr = [];
          
          // Loops through and parses through the arguments list
          for (let k = 0; k < j.length; k++)
            switch (state) {
              case "str": { if (j[k] === '"' && j[k - 1] !== "\\") { arr.push(["str", str]); str = state = ''; } else str += j[k]; } break;
              case "nostr": case "name": {
                if(!j[k].match(/[\w_]/)) {
                  arr.push([state === "nostr" ? "nostr" : "name", str]); str = '';

                  // Slices the string to the next char, and tests if there's an equal sign between
                  let nextchar = j.slice(k).match(/[\w]/);
                  if(!nextchar) break;
                  let equals = j.slice(k, nextchar.index + k).match(/\s*=\s*/);

                  // If there is an equal sign, the thing past it is most likely a string so classify as such
                  if (state === "name" && equals) k += equals[0].length, state = j[k] === '"' ? "str" : "nostr";
                } else str += j[k]; } break;
              default: { if(j[k].match(/[\w_]/)) state = "name", str += j[k]; else if(j[k] === '"') state = "str" } break;
            }
          
          // Parses the small args ast, constructs an obj
          let argobj = {};
          for(let i = 0, len = arr.length; i < len; i ++)
            if(i < len-1)
              if(arr[i][0] === "name" && arr[i + 1][0] === "name") argobj[arr[i][1]] = arr[i][1];
              else argobj[arr[i][1]] = arr[i + 1][1], i ++;
            else if(arr[i][0] === "name") argobj[arr[i][1]] = arr[i][1];
          
          // Sets corresponding ind in args
          args[ind++] = argobj;
        } ind = 0;
      }
      
      // Congregates scripts and removes them from component code
      
      
      // add the component html into the file, maybe with css
      f = f.replace(new RegExp("\\<" + i + "[^/]*\\/\\>", "g"), () => {
        
        // Trims out if statements which destroy some elements. Recursion through replace pog
        let reg = /<([\w-_]+)[^>]+if=["']([\w_]+)["'][^>]*>([\s\S]*?)<\/\1>/g, func = (match, _, v, inside) => {
          match = match[0] + match.slice(1).replace(reg, func);
          if(args[ind][v]) return match.replace("if=" + v + "\"", "");
          else return "";
        }, trimmed = ccode.replace(reg, func);
        
        // Fills in the arguments and removes things if they weren't defined
        let ret = "\n" + Object.keys(args[ind]).reduce((a, b) => a.replace(new RegExp("##" + b + "\s*=?\s*(?:(?:[\"'][^\"')]*[\"'])|[\w_\d]+)?", "g"), args[ind][b]), trimmed).replace(/##[\w\d_]+\s*=?\s*(?:["']([^"]*)['"]|([\w\d_]+))?/g, "$1$2") + "\n";
        ind ++; return ret;
      });
    }
    for(let i of components) rendercomponent(i);
    for(let i of components.slice(0, -1).reverse()) rendercomponent(i);
    // For now, temp solution to rendering components rendered in components rendered after they're passed through is to just loop thru backwards, will definitely not work for long
    
    console.log("Time rendering components: ", (performance.now() - start), "ms");
    return f;
  }
}


export function get(file) {
  file = paths.pub + file;
  if (file === paths.tmpl)
    file = paths.ind;
  if(!exists(file)) return "404 Not Found";
  
  let filetype = file.slice(file.lastIndexOf(".") + 1);
  if(resolvers[filetype])
    return resolvers[file.slice(file.lastIndexOf(".") + 1)](file);
  else return read(file).toString("utf8");
}

