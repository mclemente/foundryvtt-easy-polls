import Poll from "./Poll.js";
import constants from "./constants.mjs";

const pollTypes = ["public", "secret", "normal"];

export function createDialog(data = {}) {
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
				create: {
					icon: '<i class="fas fa-check"></i>',
					label: game.i18n.localize("Create"),
					callback: (t) => {
						const question = (t = $(t)).find("#df_macro_poll_create_title").val() || game.i18n.localize(`EasyPolls.Dialog.GeneralPoll`);
						const parts = [];
						t.find(".df_macro_poll_create_option").each(function (t) {
							parts.push($(this).val() || game.i18n.format(`EasyPolls.Dialog.option`, { number: t + 1 }));
						});
						const voteType = document.querySelector('input[name="voteType"]:checked').value;
						const voteNumber = "multiple"; //document.querySelector('input[name="voteNumber"]:checked').value;
						const resultType = document.querySelector('input[name="resultType"]:checked').value;
						Poll.create({ question, parts, voteType, voteNumber, resultType });
					},
				},
			},
			callback: () => {},
			default: "create",
			content: `<table id="df_macro_poll_create" style="margin-top: 0">
						<thead>
							<input type="text" id="df_macro_poll_create_title" placeholder="${game.i18n.localize("EasyPolls.Dialog.PollTitle")}"
							${data?.question ? `value="${data.question}"` : ""} style="margin-bottom: 0.5em;">
							<div>
								<div style="float: left; width:50%;">
									${game.i18n.localize("EasyPolls.Dialog.ResultType.name")}
									<div>
										<input type="radio" id="r1" name="resultType" value="open" checked>
										<label for="r1">${game.i18n.localize("EasyPolls.Dialog.ResultType.options.1")}</label>
									</div>
									<div>
										<input type="radio" id="r2" name="resultType" value="gm">
										<label for="r2">${game.i18n.localize("EasyPolls.Dialog.ResultType.options.2")}</label>
									</div>
								</div>
								<!--
								<div style="float: left; width:33%;">
									Number of Votes
									<div>
										<input type="radio" id="vn1" name="voteNumber" value="single" checked>
										<label for="vn1">Single Vote</label>
									</div>
									<div>
										<input type="radio" id="vn2" name="voteNumber" value="multiple">
										<label for="vn2">Multiple Votes</label>
									</div>
								</div>
								-->
								<div style="float: right; width:50%;">
									${game.i18n.localize("EasyPolls.Dialog.VoteType.name")}
									<div>
										<input type="radio" id="v1" name="voteType" value="normal" ${data?.type == "normal" || !data?.type ? "checked" : ""}>
										<label for="v1" title="Voters are shown to players">${game.i18n.localize("EasyPolls.Dialog.VoteType.options.1")}</label>
									</div>
									<div>
										<input type="radio" id="v2" name="voteType" value="secret" ${data?.type == "secret" ? "checked" : ""}>
										<label for="v2" title="Voters are hidden from players">${game.i18n.localize("EasyPolls.Dialog.VoteType.options.2")}</label>
									</div>
								</div>
							</div>
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

export class PollCommand {
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
				if (pollTypes.includes(parts[0].toLowerCase())) data.type = parts.shift().toLowerCase();
				data.question = data.parts.shift();

				setTimeout(() => createDialog(data), 0);
				return false;
			} else {
				pollRegex = new RegExp("^(\\/p(?:oll)?)", "i");
				match = messageText.match(pollRegex);
				if (match) {
					setTimeout(() => createDialog(), 0);
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
