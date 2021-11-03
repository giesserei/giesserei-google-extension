import {GoogleDriveApi} from "./GoogleDriveApi";
import * as Utils from "./Utils";

const driveRootFolderUrlPrefix = "https://drive.google.com/drive/folders/";

var jsParms:        any;
var contentElement: HTMLElement;
var driveApi:       GoogleDriveApi;

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
   const pathSegs = Utils.splitPath(path);
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
         const relPathSegs = pathSegs.slice(0, i + 1);
         const relPath = Utils.composePath(relPathSegs) + "/";
         breadcrumbElement.href = genAbsDrivePath(relPath);
         breadcrumbElement.dataset.path = relPath; }
      breadcrumbElement.addEventListener("click", (event: Event) => Utils.catchError(breadcrumb_click, event)); }
   return breadcrumbsElement; }

function formatDateTime (s: string) : string {
   if (!s) {
      return ""; }
   const d = new Date(s);
   return fmt2(d.getDate()) + "." + fmt2((d.getMonth() + 1)) + "." + d.getFullYear() + " " + fmt2(d.getHours()) + ":" + fmt2(d.getMinutes());
   function fmt2 (i: number) : string {
      return String(i).padStart(2, "0"); }}

function renderDirectoryList (dirPath: string, dirList: any[], isDriveList: boolean) : HTMLElement {
   const dirListElement = document.createElement("div");
   dirListElement.className = "gge_dirList";
   for (const e of dirList) {
      const relPath =
            (dirPath.startsWith("/") ? dirPath.substring(1) : dirPath) +
            (dirPath && !dirPath.endsWith("/") ? "/" : "") +
            Utils.encodePathSegment(e.name) +
            ((isDriveList || isMimeTypeDirectory(e.mimeType)) ? "/" : "");
      const isShortcut = !isDriveList && e.mimeType == "application/vnd.google-apps.shortcut";
      const mimeType = isDriveList ? "application/vnd.google-apps.folder" : isShortcut ? e.shortcutDetails.targetMimeType : e.mimeType;
      // directory entry / row
      const entryElement = document.createElement("div");
      entryElement.className = "gge_dirEntry";
      entryElement.dataset.mimeType = mimeType;
      entryElement.dataset.fileId = isShortcut ? e.shortcutDetails.targetId : e.id;
      entryElement.dataset.path = relPath;
      // entry link
      const entryLinkElement = document.createElement("a");
      entryElement.appendChild(entryLinkElement);
      entryLinkElement.className = "gge_dirEntryLink";
      entryLinkElement.href = genAbsDrivePath(relPath);
      entryLinkElement.addEventListener("click", (event: Event) => Utils.catchError(directoryEntry_click, event));
      // main icon
      const entryIconElement = document.createElement("img");
      entryLinkElement.appendChild(entryIconElement);
      entryIconElement.className = "gge_dirEntryIcon";
      entryIconElement.src = jsParms.staticUrlBase + "images/" + getIconName(mimeType);
      // name
      const nameElement = document.createElement("div");
      entryLinkElement.appendChild(nameElement);
      nameElement.className = "gge_dirEntryName";
      nameElement.textContent = e.name;
      // time (modifiedTime)
      const timeElement = document.createElement("div");
      entryElement.appendChild(timeElement);
      timeElement.className = "gge_dirEmtryTime";
      timeElement.textContent = isShortcut ? "" : formatDateTime(e.modifiedTime);
      // buttons at the right
      const rightButtonsElement = document.createElement("div");
      entryElement.appendChild(rightButtonsElement);
      rightButtonsElement.className = "gge_dirEntryRightButtons";
      // alternate format links
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
   contentElement.replaceChildren(breadcrumbsElement, dirListElement); }

async function listDirectoryWithId (dirId: string, dirPath: string) {
   const files = await driveApi.getDirectoryFiles(dirId);
   renderDirectory(dirPath, files, false); }

async function listDirectory (path: string) {
   const pathSegs = Utils.splitPath(path);
   if (pathSegs.length == 0) {                             // root directory
      const drives = await driveApi.getSharedDrives();
      renderDirectory("", drives, true); }
    else {
      const dir = await driveApi.findPath(pathSegs);
      if (!dir) {
         throw new Error(`Directory "${path}" not found.`); }
      const isShortcut = dir.mimeType == "application/vnd.google-apps.shortcut";
      const mimeType = isShortcut ? dir.shortcutDetails.targetMimeType : dir.mimeType;
      if (!isMimeTypeDirectory(mimeType)) {
         throw new Error(`File object "${path}" is not a directory.`); }
      const dirId = isShortcut ? dir.shortcutDetails.targetId : dir.id;
      await listDirectoryWithId(dirId, path); }}

function isGoogleAccessTokenValid() : boolean {
   if (!jsParms) {
      return false; }
   const remainingSecs = (jsParms.googleAccessTokenSecs ?? 0) - performance.now() / 1000;
   return remainingSecs > 180; }

function isInternalClick (event: MouseEvent) : boolean {
   return !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button == 0 && !!event.target; }

function pushHistoryState (path: string) {
   const url = genAbsDrivePath(path);
   history.pushState(path, path, url); }

async function popHistoryState (event: PopStateEvent) {
   const path = event.state ?? "";
   if (!isGoogleAccessTokenValid()) {
      window.location.reload();
      return; }
   await listDirectory(path); }

async function breadcrumb_click (event: MouseEvent) {
   if (!isInternalClick(event) || !isGoogleAccessTokenValid()) {
      return; }
   event.preventDefault();
   const path = (<HTMLElement>event.target).dataset.path ?? "";
   pushHistoryState(path);
   await listDirectory(path);
   window.scrollTo(0, 0); }

async function directoryEntry_click (event: MouseEvent) {
   if (!isInternalClick(event) || !isGoogleAccessTokenValid()) {
      return; }
   const entryElement = <HTMLElement>((<HTMLElement>event.target).closest(".gge_dirEntry"))!;
   const mimeType = entryElement.dataset.mimeType!;
   const fileId = entryElement.dataset.fileId!;
   const path = entryElement.dataset.path!;
   if (!isMimeTypeDirectory(mimeType)) {
      return; }                                            // File open/download is currently done server-side.
   event.preventDefault();
   pushHistoryState(path);
   await listDirectoryWithId(fileId, path);
   window.scrollTo(0, 0); }

export async function startup (jsParmsP: Object) {
   jsParms = jsParmsP;
   contentElement = document.getElementById("gge_content")!;
   driveApi = new GoogleDriveApi(jsParms.googleAccessToken);
   window.onpopstate = popHistoryState;
   await listDirectory(jsParms.path); }
