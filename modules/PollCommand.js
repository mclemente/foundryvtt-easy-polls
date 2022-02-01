import Poll from "./Poll.js";
import constants from "./constants.mjs";

const pollTypes = ["public", "private", "normal"];

function createDialog(data = {}) {
	let dialogHtml = null,
		table = null,
		dialog = null,
		first = !0;
	const processOptions = function () {
		table.find(".df_macro_poll_create_numeral").each(function (t) {
			$(this).text(`${t + 1}. `);
		});
		table.find(".df_macro_poll_create_option").each(function (t) {
			$(this).attr("placeholder", `Option ${t + 1}`);
		});
	};
	dialog = new Dialog(
		{
			title: game.i18n.localize(`EasyPolls.Dialog.title`),
			label: "create",
			buttons: {
				// cancel: { icon: '<i class="fas fa-times"></i>', label: game.i18n.localize("Cancel"), callback: (t) => {} },
				create: {
					icon: '<i class="fas fa-check"></i>',
					label: game.i18n.localize("Create"),
					callback: (t) => {
						const question = (t = $(t)).find("#df_macro_poll_create_title").val() || game.i18n.localize(`EasyPolls.Dialog.GeneralPoll`);
						// let l = "/p " + ((t = $(t)).find("#df_macro_poll_create_title").val() || game.i18n.localize(`EasyPolls.Dialog.GeneralPoll`));
						const parts = [];
						t.find(".df_macro_poll_create_option").each(function (t) {
							// l = l + "\n" + ($(this).val() || game.i18n.format(`EasyPolls.Dialog.option`, { number: t + 1 }));
							parts.push($(this).val() || game.i18n.format(`EasyPolls.Dialog.option`, { number: t + 1 }));
						});
						// ui.chat.processMessage(l);
						const type = "normal";
						Poll.create({ question, parts, type });
					},
				},
			},
			callback: () => {},
			// default: "create",
			content: `<table id="df_macro_poll_create" style="margin-top: 0">
						<thead>
							<input type="text" id="df_macro_poll_create_title" placeholder="${game.i18n.localize("EasyPolls.Dialog.PollTitle")}"
							${data?.question ? `value="${data.question}"` : ""}>
							<button id="df_macro_poll_add" style="margin:0.5em 0">
								<i class="fas fa-add"></i> ${game.i18n.localize("EasyPolls.Dialog.addOption")}
							</button>
						</thead>
					</table>`,
			render: (t) => {
				dialogHtml = $(t);
				table = dialogHtml.find("#df_macro_poll_create");
				t.find("#df_macro_poll_add").click(() => {
					const t = table.find(".df_macro_poll_create_numeral").length + 1;
					const l = $(
						`<tr>\n\t\t
							<td class="df_macro_poll_create_numeral">${t}.</td>\n\t\t
							<td>
								<input class="df_macro_poll_create_option" type="text" placeholder="${game.i18n.format("EasyPolls.Dialog.option", { number: t })}" />
							</td>\n\t\t
							<td>
								<button class="df_macro_poll_create_delete"><i class="fas fa-times"></i></button>
							</td>\n\t
						</tr>`
					);
					table.append(l);
					l.find(".df_macro_poll_create_delete").click(() => {
						dialog.setPosition({ height: dialog.position.height - l.height() }), l.remove(), processOptions();
					});
					first ? (first = !1) : (dialog.setPosition({ height: dialog.position.height + l.height() }), processOptions());
				});
				if (data?.parts) {
					data.parts.forEach((part) => {
						const t = table.find(".df_macro_poll_create_numeral").length + 1;
						const l = $(`<tr>\n\t\t
							<td class="df_macro_poll_create_numeral">${t}.</td>\n\t\t
							<td>
								<input class="df_macro_poll_create_option" type="text" placeholder="${game.i18n.format("EasyPolls.Dialog.option", { number: t })}" value="${part}" />
							</td>\n\t\t
							<td>
								<button class="df_macro_poll_create_delete"><i class="fas fa-times"></i></button>
							</td>\n\t
						</tr>`);
						table.append(l);
						l.find(".df_macro_poll_create_delete").click(() => {
							dialog.setPosition({ height: dialog.position.height - l.height() }), l.remove(), processOptions();
						});
					});
					first ? (first = !1) : (dialog.setPosition({ height: dialog.position.height + l.height() }), processOptions());
				} else {
					dialogHtml.find("#df_macro_poll_add").click();
				}
			},
		},
		{ resizable: !0 }
	).render(!0);
}

export default class PollCommand {
	static registerCommand() {
		Hooks.on("chatMessage", (chatLog, messageText, chatData) => {
			let pollRegex = new RegExp("^(\\/p(?:oll)? )", "i");
			let match = messageText.match(pollRegex);

			if (match) {
				let content = messageText.replace(match[1], "");
				let data = {};
				let parts = content.split(/\n/);
				data.parts = parts.map((s) => s.trim()).filter((s) => s.length);
				data.type = "normal";
				if (pollTypes.includes(parts[0].toLowerCase())) type = parts.shift().toLowerCase();
				data.question = data.parts.shift();

				createDialog(data);
				return false;
			} else {
				pollRegex = new RegExp("^(\\/p(?:oll)?)", "i");
				match = messageText.match(pollRegex);
				if (match) {
					createDialog();
					return false;
				}
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
