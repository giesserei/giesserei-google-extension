import {GoogleDriveApi} from "./GoogleDriveApi";
import * as Utils from "./Utils";

const driveRootFolderUrlPrefix = "https://drive.google.com/drive/folders/";

var jsParms:        any;
var contentElement: HTMLElement;
var driveApi:       GoogleDriveApi;

function encodePathSegment (s: string) : string {
   // Apache does not allow %2F in the URL path. So we have to encode slash characters differently.
   return encodeURIComponent(s.replaceAll("/", "~2F")); }

function decodePathSegment (s: string) : string {
   return decodeURIComponent(s).replace("~2F", "/"); }

// Composes a path string from path segments.
/*
function composePath (a: string[]) : string {
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
*/

// Splits a path string into path segments.
function splitPath (s: string) : string[] {
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

function genAbsDrivePath (path: string) : string {
   return Utils.joinPath(jsParms.driveUrlBase, path); }

function isMimeTypeDirectory (mimeType: string) : boolean {
   switch (mimeType) {
      case "application/vnd.google-apps.folder": return true;
      default:                                   return false; }}

function getIconName (mimeType: string) : string {
   switch (mimeType) {
      // Google drive:
      case "application/vnd.google-apps.folder":       return "folder.svg";
      case "application/vnd.google-apps.shortcut":     return "unsupportedFile.svg";
      // Google docs:
      case "application/vnd.google-apps.document":     return "googleDoc.svg";
      case "application/vnd.google-apps.spreadsheet":  return "googleSpreadsheet.svg";
      case "application/vnd.google-apps.presentation": return "googleSlides.svg";
      // MS Office:
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":   return "wordFile.svg";
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":         return "excelFile.svg";
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation": return "powerpointFile.svg";
      // ODF / Open Office / Libre Office
      case "application/vnd.oasis.opendocument.text":        return "odtFile.svg";
      case "application/vnd.oasis.opendocument.spreadsheet": return "odsFile.svg";
      case "application/vnd.oasis.opendocument.presentation":return "odpFile.svg";
      // Other:
      case "application/pdf": return "pdfFile.svg";
      case "text/html":       return "htmlFile.svg";
      default:                return "file.svg"; }}

// Alternate formats in addition to PDF.
function getAlternateFormats (mimeType: string) : string[] {
   switch (mimeType) {
      case "application/vnd.google-apps.document": return [
         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
         "application/vnd.oasis.opendocument.text",
         "text/html" ];
      case "application/vnd.google-apps.spreadsheet": return [
         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
         "application/vnd.oasis.opendocument.spreadsheet" ];
      case "application/vnd.google-apps.presentation": return [
         "application/vnd.openxmlformats-officedocument.presentationml.presentation",
         "application/vnd.oasis.opendocument.presentation" ];
      default: return []; }}

function getFormatName (mimeType: string) : string {
   switch (mimeType) {
      // MS Office
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":   return "Word";
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":         return "Excel";
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation": return "PowerPoint";
      // ODF / Open Office / Libre Office
      case "application/vnd.oasis.opendocument.text":         return "OpenDocument Text";
      case "application/vnd.oasis.opendocument.spreadsheet":  return "OpenDocument Spreadsheet";
      case "application/vnd.oasis.opendocument.presentation": return "OpenDocument Presentation";
      // Other:
      case "application/pdf": return "PDF";
      case "text/html":       return "HTML";
      default:                return mimeType; }}

// Opposite to getMimeTypeFromFormatCode() in Utils.php.
function getFormatCode (mimeType: string) : string {
   switch (mimeType) {
      // MS Office
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":   return "docx";
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":         return "xlsx";
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation": return "pptx";
      // ODF / Open Office / Libre Office
      case "application/vnd.oasis.opendocument.text":         return "odt";
      case "application/vnd.oasis.opendocument.spreadsheet":  return "ods";
      case "application/vnd.oasis.opendocument.presentation": return "odp";
      // Other:
      case "application/pdf": return "pdf";
      case "text/html":       return "html";
      default:                return mimeType; }}          // fallback

function renderBreadcrumbs (path: string) : HTMLElement {
   const pathSegs = splitPath(path);
   const breadcrumbsElement = document.createElement("div");
   breadcrumbsElement.className = "gge_breadcrumbs";
   for (let i = -1; i < pathSegs.length; i++) {
      if (i >= 0) {
         const separatorElement = document.createElement("div");
         breadcrumbsElement.appendChild(separatorElement);
         separatorElement.className = "gge_breadcrumbSeparator";
         separatorElement.textContent = "/"; }
      //
      const breadcrumbElement = document.createElement("a");
      breadcrumbsElement.appendChild(breadcrumbElement);
      breadcrumbElement.className = "gge_breadcrumb";
      if (i == -1) {
         breadcrumbElement.textContent = jsParms.rootFolderDisplayName;
         breadcrumbElement.href = jsParms.driveUrlBase; }
       else {
         breadcrumbElement.textContent = pathSegs[i];
         const relPath = pathSegs.slice(0, i + 1).join("/") + "/";
         breadcrumbElement.href = genAbsDrivePath(relPath);
         breadcrumbElement.dataset.path = relPath; }
      breadcrumbElement.addEventListener("click", <any>breadcrumb_click); }
   return breadcrumbsElement; }

function renderDirectoryList (dirPath: string, dirList: any[], isDriveList: boolean) : HTMLElement {
   const dirListElement = document.createElement("div");
   dirListElement.className = "gge_dirList";
   for (const e of dirList) {
      const relPath =
            (dirPath.startsWith("/") ? dirPath.substring(1) : dirPath) +
            (dirPath && !dirPath.endsWith("/") ? "/" : "") +
            encodePathSegment(e.name) +
            ((isDriveList || isMimeTypeDirectory(e.mimeType)) ? "/" : "");
      const mimeType = isDriveList ? "application/vnd.google-apps.folder" : e.mimeType;
      //
      const entryElement = document.createElement("div");
      entryElement.className = "gge_dirEntry";
      entryElement.dataset.mimeType = mimeType;
      entryElement.dataset.fileId = e.id;
      entryElement.dataset.driveId = isDriveList ? e.id : e.driveId;
      entryElement.dataset.path = relPath;
      //
      const entryLinkElement = document.createElement("a");
      entryElement.appendChild(entryLinkElement);
      entryLinkElement.className = "gge_dirEntryLink";
      entryLinkElement.href = genAbsDrivePath(relPath);
      entryLinkElement.addEventListener("click", <any>directoryEntry_click);
      //
      const entryIconElement = document.createElement("img");
      entryLinkElement.appendChild(entryIconElement);
      entryIconElement.className = "gge_dirEntryIcon";
      entryIconElement.src = jsParms.staticUrlBase + "images/" + getIconName(mimeType);
      //
      const nameElement = document.createElement("div");
      entryLinkElement.appendChild(nameElement);
      nameElement.className = "gge_dirEntryName";
      nameElement.textContent = e.name;
      //
      const rightButtonsElement = document.createElement("div");
      entryElement.appendChild(rightButtonsElement);
      rightButtonsElement.className = "gge_dirEntryRightButtons";
      //
      const altFormats = getAlternateFormats(mimeType);
      for (const altFormat of altFormats) {
         const formatName = getFormatName(altFormat);
         const formatCode = getFormatCode(altFormat);
         const link = genAbsDrivePath(relPath) + "?fmt=" + encodeURIComponent(formatCode);
         const icon = jsParms.staticUrlBase + "images/" + getIconName(altFormat);
         const altFormatLinkElement = Utils.renderImgLink("gge_dirEntryAltFormatLink", icon, link, formatName);
         rightButtonsElement.appendChild(altFormatLinkElement); }
      //
      const googleLink = isDriveList ? driveRootFolderUrlPrefix + encodeURIComponent(e.id) : e.webViewLink;
      const googleLinkElement = Utils.renderImgLink("gge_dirEntryGoogleLink", jsParms.staticUrlBase + "images/googleGLogo.svg", googleLink, "Google");
      rightButtonsElement.appendChild(googleLinkElement);
      //
      dirListElement.appendChild(entryElement); }
   return dirListElement; }

function renderDirectory (dirPath: string, dirList: any[], isDriveList: boolean) {
   const dirListElement = renderDirectoryList(dirPath, dirList, isDriveList);
   const breadcrumbsElement = renderBreadcrumbs(dirPath);
   (<any>contentElement).replaceChildren(breadcrumbsElement, dirListElement); }   // TODO: <any> enfernen, TypeDef f�r replaceChildren() kommt im TypeScript 4.4

async function listDirectoryWithId (dirId: string, driveId: string, dirPath: string) {
   const files = await driveApi.getDirectoryFiles(dirId, driveId);
   renderDirectory(dirPath, files, false); }

async function listDirectory (path: string) {
   const pathSegs = splitPath(path);
   if (pathSegs.length == 0) {                             // root directory
      const drives = await driveApi.getSharedDrives();
      renderDirectory("", drives, true); }
    else {
       const dir = await driveApi.findPath(pathSegs);
       if (!dir) {
          throw new Error(`Directory "${path}" not found.`); }
       if (!isMimeTypeDirectory(dir.mimeType)) {
          throw new Error(`File object "${path}" is not a directory.`); }
       await listDirectoryWithId(dir.id, dir.driveId, path); }}

function isInternalClick (event: MouseEvent) : boolean {
   return !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button == 0 && !!event.target; }

function pushHistoryState (path: string) {
   const url = genAbsDrivePath(path);
   history.pushState(path, path, url); }

async function popHistoryState (event: PopStateEvent) {
   const path = event.state ?? "";
   await listDirectory(path); }

async function breadcrumb_click (event: MouseEvent) {
   if (!isInternalClick(event)) {
      return; }
   event.preventDefault();
   const path = (<HTMLElement>event.target).dataset.path ?? "";
   pushHistoryState(path);
   window.scrollTo(0, 0);
   await listDirectory(path); }

async function directoryEntry_click (event: MouseEvent) {
   if (!isInternalClick(event)) {
      return; }
   const entryElement = <HTMLElement>((<HTMLElement>event.target).closest(".gge_dirEntry"))!;
   const mimeType = entryElement.dataset.mimeType!;
   const fileId = entryElement.dataset.fileId!;
   const driveId = entryElement.dataset.driveId!;
   const path = entryElement.dataset.path!;
   if (!isMimeTypeDirectory(mimeType)) {
      return; }                                            // File open/download is currently done server-side.
   event.preventDefault();
   pushHistoryState(path);
   window.scrollTo(0, 0);
   await listDirectoryWithId(fileId, driveId, path); }

export async function startup (jsParmsP: Object) {
   jsParms = jsParmsP;
   contentElement = document.getElementById("gge_content")!;
   driveApi = new GoogleDriveApi(jsParms.googleAccessToken);
   window.onpopstate = popHistoryState;
   await listDirectory(jsParms.path); }