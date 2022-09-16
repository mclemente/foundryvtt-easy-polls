import constants from "./constants.mjs";

function addSetting(key, data) {
	const commonData = {
		name: `EasyPolls.Settings.${key}.name`,
		hint: `EasyPolls.Settings.${key}.hint`,
		scope: "world",
		config: true,
	};
	game.settings.register(constants.moduleName, key, Object.assign(commonData, data));
}

export default function registerSettings() {}
