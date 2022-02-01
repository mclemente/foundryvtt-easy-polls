import constants from "./constants.mjs";
import registerSettings from "./settings.js";
import { createDialog, PollCommand } from "./PollCommand.js";
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
	Hooks.callAll(`${constants.moduleName}:afterInit`);
});

Hooks.once("setup", () => {
	Hooks.callAll(`${constants.moduleName}:afterSetup`);
});

Hooks.once("ready", () => {
	Socket.listen();

	Hooks.callAll(`${constants.moduleName}:afterReady`);
});
