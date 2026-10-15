"use strict";

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("focusForgeDesktop", Object.freeze({
  isDesktopApp: true
}));
