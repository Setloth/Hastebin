/**
 * @name Hastebin
 * @author Echology
 * @version 3.0.0
 */

const request = require("request")
const electron = require("electron")
const fs = require("fs")
const path = require("path")

const config = {
    info: {
        name: "Hastebin",
        authors: [
            {
                name: "Echology",
                discord_id: "272875632088842240",
            },
        ],
        version: "3.0.0",
        description: "Uploads text to https://hastebin.com",
    },
    changelog: [
        {
            title: "Discord Update",
            items: ["Fixed plugin to work with the new updates :)"],
        },
    ],
}

module.exports = !global.ZeresPluginLibrary
    ? class {
          constructor() {
              this._config = config
          }

          load() {
              BdApi.showConfirmationModal(
                  "Library Missing",
                  `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`,
                  {
                      confirmText: "Download Now",
                      cancelText: "Cancel",
                      onConfirm: () => {
                          request.get(
                              "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
                              async (error, _response, body) => {
                                  if (error)
                                      return electron.shell.openExternal(
                                          "https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js"
                                      )
                                  await new Promise((r) =>
                                      fs.writeFile(
                                          path.join(
                                              BdApi.Plugins.folder,
                                              "0PluginLibrary.plugin.js"
                                          ),
                                          body,
                                          r
                                      )
                                  )
                              }
                          )
                      },
                  }
              )
          }

          start() {}

          stop() {}
      }
    : (([Plugin, Library]) => {
          const { Patcher, Toasts, WebpackModules, ContextMenu: DCM } = Library
          const { copy } = WebpackModules.getByProps("copy", "cut", "close")
          return class Hastebin extends Plugin {
              constructor() {
                  super()
              }

              async onStart() {
                  this.patcher()
              }

              patcher() {
                  const patch = (_, [props], component) => {
                      const { children } = component.props
                      const { content } = props.message
                      children.unshift(
                          DCM.buildMenuItem({
                              label: "Create Hastebin",
                              type: "text",
                              action: () => {
                                  request.post(
                                      {
                                          url: "https://www.toptal.com/developers/hastebin/documents",
                                          body: content,
                                      },
                                      (error, _response, body) => {
                                          let data = JSON.parse(body)
                                          if (error || !data.key)
                                              return BdApi.showNotice(
                                                  "Error creating Hastebin link",
                                                  {
                                                      type: "error",
                                                      timeout: 5e3,
                                                  }
                                              )
                                          copy(
                                              "https://hastebin.com/" + data.key
                                          )
                                          new Notification("New Hastebin", {
                                              silent: false,
                                              body: "Hastebin url copied to clipboard.",
                                              icon: "https://progsoft.net/images/hastebin-icon-b45e3f5695d3f577b2630648bd00584195822e3d.png",
                                          })
                                          BdApi.showNotice("Hastebin Created", {
                                              type: "info",
                                              buttons: [
                                                  {
                                                      label: "Open",
                                                      onClick: () => {
                                                          window.open(
                                                              "https://hastebin.com/" +
                                                                  data.key,
                                                              "_blank"
                                                          )
                                                      },
                                                  },
                                              ],
                                              timeout: 10e3,
                                          })
                                      }
                                  )
                              },
                          })
                      )
                  }

                  DCM.getDiscordMenu(
                      (m) => m?.displayName == "MessageContextMenu"
                  ).then((m) => {
                      console.log(m)
                      Patcher.after(m, "default", patch)
                      DCM.forceUpdateMenus()
                  })
              }

              onLoad() {}

              onStop() {
                  Patcher.unpatchAll()
              }
          }
      })(global.ZeresPluginLibrary.buildPlugin(config))
