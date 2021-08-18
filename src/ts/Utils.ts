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
