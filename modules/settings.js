import constants from "./constants.mjs";

export default function registerSettings() {
	game.settings.register(constants.moduleName, "playersWelcomeScreen", {
		name: "EasyPolls.Settings.playersWelcomeScreen.Enable",
		hint: "EasyPolls.Settings.playersWelcomeScreen.EnableHint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
}
