import constants from "./constants.mjs";
import { createDialog, PollCommand, quickPollMenu } from "./PollCommand.js";
import registerSettings from "./settings.js";
import Socket from "./Socket.js";
import { QuickPolls } from "./utility/QuickPolls.js";

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
	function localizeValue(value) {
		if (typeof value === "string") return game.i18n.localize(value);
		else if (Array.isArray(value)) return value.map(localizeValue);
		return value;
	}

	const localizedQuickPolls = {};
	for (const poll in QuickPolls) {
		localizedQuickPolls[poll] = {};
		for (const element in QuickPolls[poll]) {
			localizedQuickPolls[poll][element] = localizeValue(QuickPolls[poll][element]);
		}
	}
	Socket.listen();
	Hooks.callAll(`${constants.moduleName}:afterReady`);
});
