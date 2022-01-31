import Poll from "./Poll.js";
import constants from "./constants.mjs";

const pollTypes = ["public", "private", "normal"];

function createDialog() {
	let dialogHtml = null,
		table = null,
		dialog = null,
		first = !0;
	const processOptions = function () {
		table.find(".df_macro_poll_create_numeral").each(function (t) {
			$(this).text(`${t + 1}. `);
		}),
			table.find(".df_macro_poll_create_option").each(function (t) {
				$(this).attr("placeholder", `Option ${t + 1}`);
			});
	};
	dialog = new Dialog(
		{
			title: "Create Forien Easy Poll",
			label: "create",
			buttons: {
				// cancel: { icon: '<i class="fas fa-times"></i>', label: game.i18n.localize("Cancel"), callback: (t) => {} },
				create: {
					icon: '<i class="fas fa-check"></i>',
					label: game.i18n.localize("Create"),
					callback: (t) => {
						let l = "/p " + ((t = $(t)).find("#df_macro_poll_create_title").val() || "General Poll");
						t.find(".df_macro_poll_create_option").each(function (t) {
							l = l + "\n" + ($(this).val() || `Option ${t + 1}`);
						}),
							ui.chat.processMessage(l);
					},
				},
			},
			callback: () => {},
			// default: "create",
			content: `<table id="df_macro_poll_create" style="margin-bottom:24px">
							<thead>
								<input type="text" id="df_macro_poll_create_title" placeholder="Poll Title"><br>
								<button id="df_macro_poll_add" style="margin:12px 0"><i class="fas fa-add"></i> Add Option</button>
							</thead>
						</table>`,
			render: (t) => {
				(dialogHtml = $(t)),
					(table = dialogHtml.find("#df_macro_poll_create")),
					t.find("#df_macro_poll_add").click(() => {
						const t = table.find(".df_macro_poll_create_numeral").length + 1,
							l = $(
								`<tr>\n\t\t<td class="df_macro_poll_create_numeral">${t}. </td>\n\t\t<td><input class="df_macro_poll_create_option" type="text" placeholder="Option ${t}" /></td>\n\t\t<td><button class="df_macro_poll_create_delete"><i class="fas fa-times"></i></button></td>\n\t</tr>`
							);
						table.append(l),
							l.find(".df_macro_poll_create_delete").click(() => {
								dialog.setPosition({ height: dialog.position.height - l.height() }), l.remove(), processOptions();
							}),
							first ? (first = !1) : (dialog.setPosition({ height: dialog.position.height + l.height() }), processOptions());
					}),
					dialogHtml.find("#df_macro_poll_add").click();
			},
		},
		{ resizable: !0 }
	).render(!0);
}

export default class PollCommand {
	static registerCommand() {
		Hooks.on("chatMessage", (chatLog, messageText, chatData) => {
			let match = this.checkCommand(messageText);

			if (match) {
				let content = messageText.replace(match[1], "");
				this.createPoll(content);
				return false;
			} else if (messageText.toLowerCase() === "/p") {
				setTimeout(createDialog, 0);
				return false;
			}
		});

		Hooks.on("renderChatMessage", (chatMessage, html, messageData) => {
			let isPoll = chatMessage.getFlag(constants.moduleName, "isPoll");

			if (isPoll) {
				Poll.renderPoll(chatMessage, html);

				return false;
			}
		});
	}

	static checkCommand(messageText) {
		const poll = new RegExp("^(\\/p(?:oll)? )", "i");

		return messageText.match(poll);
	}

	static async createPoll(content) {
		let parts = content.split(/\n/);
		parts = parts.map((s) => s.trim()).filter((s) => s.length);
		let type = "normal";
		if (pollTypes.includes(parts[0].toLowerCase())) type = parts.shift().toLowerCase();
		let question = parts.shift();

		return Poll.create({ question, parts, type });
	}
}
