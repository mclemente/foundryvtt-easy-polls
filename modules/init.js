import constants from "./constants.mjs";
import registerSettings from "./settings.js";
import { createDialog, PollCommand, quickPollMenu } from "./PollCommand.js";
import { QuickPolls } from "./utility/QuickPolls.js";
import Socket from "./Socket.js";

Hooks.once("init", () => {
	registerSettings();

	PollCommand.registerCommand();
	game.keybindings.register(constants.moduleName, "CreatePoll", {
		name: "EasyPolls.Keybindings.CreatePoll.name",
		hint: "EasyPolls.Keybindings.CreatePoll.hint",
		onDown: () => {
			createDialog();
		},
		editable: [{ key: "KeyP" }],
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
	game.keybindings.register(constants.moduleName, "QuickPolls", {
		name: "EasyPolls.Keybindings.QuickPolls.name",
		hint: "EasyPolls.Keybindings.QuickPolls.hint",
		onDown: () => {
			quickPollMenu();
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
	Hooks.callAll(`${constants.moduleName}:afterInit`);
});

Hooks.once("setup", () => {
	Hooks.callAll(`${constants.moduleName}:afterSetup`);
});

Hooks.once("ready", () => {
	Object.keys(QuickPolls).forEach((poll) => {
		Object.keys(QuickPolls[poll]).forEach((element) => {
			if (typeof QuickPolls[poll][element] == "string") QuickPolls[poll][element] = game.i18n.localize(QuickPolls[poll][element]);
			else if (Array.isArray(QuickPolls[poll][element])) {
				QuickPolls[poll][element].forEach((part, i) => {
					QuickPolls[poll][element][i] = game.i18n.localize(part);
				});
			}
		});
	});
	Socket.listen();

	Hooks.callAll(`${constants.moduleName}:afterReady`);
});
