export function joinPath (...a: string[]) : string {
   if (!a) {
      return ""; }
   let s = "";
   for (const s2 of a) {
      if (!s2) {
         continue; }
      if (!s) {
         s = s2;
         continue; }
      if (s2 == "/") {
         continue; }
      if (!s.endsWith("/")) {
         s += "/"; }
      s += s2.startsWith("/") ? s2.substring(1) : s2; }
   return s; }

export function encodePathSegment (s: string) : string {
   // Apache does not allow %2F in the URL path. So we have to encode slash characters differently.
   return encodeURIComponent(s.replaceAll("/", "~2F")); }

export function decodePathSegment (s: string) : string {
   return decodeURIComponent(s).replace("~2F", "/"); }

// Composes a path string from path segments.
export function composePath (a: string[]) : string {
   if (!a?.length) {
      return "/"; }
   let s = "";
   for (const s2 of a) {
      if (!s2) {
         continue; }
      if (s) {
         s += "/"; }
      s += encodePathSegment(s2); }
   return s || "/"; }

// Splits a path string into path segments.
export function splitPath (s: string) : string[] {
   if (!s || s == "/") {
      return []; }
   const a = [];
   let p = 0;
   while (p < s.length) {
      const p1 = p;
      while (p < s.length && s[p] != "/") {
         p++; }
      if (p > p1) {
         a.push(decodePathSegment(s.substring(p1, p))); }
      p++; }
   return a; }

export function renderImgLink (className: string, imgUrl: string, linkUrl: string, title?: string) : HTMLElement {
   const anchorElement = document.createElement("a");
   anchorElement.className = className;
   anchorElement.href = linkUrl;
   //
   const imgElement = document.createElement("img");
   anchorElement.appendChild(imgElement);
   imgElement.src = imgUrl;
   if (title) {
      imgElement.title = title; }
   //
   return anchorElement; }

export function catchError (f: Function, ...args: any[]) {
   void catchErrorAsync(f, ...args); }

async function catchErrorAsync(f: Function, ...args: any[]) {
   try {
      const r = f(...args);
      if (r instanceof Promise) {
         await r; }}
    catch (error) {
      console.log(error);
      alert("Error: " + error); }}
