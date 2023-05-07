import constants from "./constants.mjs";
import Socket from "./Socket.js";
import EasyPollError from "./utility/Error.js";

export default class Poll extends ChatMessage {
	static async create(data, options = {}) {
		const { question, parts, voteType = "normal", voteNumber = "multiple", resultType = "open" } = data;
		const partsData = parts.map((p) => ({ label: p, percent: 0, count: 0 }));
		const isGM = game.user.isGM;
		const pollData = { total: 0, question, parts: partsData, answers: [], voteType, voteNumber, resultType };
		const template = await renderTemplate(`${constants.modulePath}/templates/poll.html`, {
			...pollData,
			isGM,
			message: {
				timestamp: new Date().getTime(),
			},
		});

		try {
			const messageEntity = await super.create({ content: template }, options);
			await messageEntity.setFlag(constants.moduleName, "isPoll", true);
			await messageEntity.setFlag(constants.moduleName, "pollData", pollData);
			return messageEntity;
		} catch (error) {
			console.error("Easy Polls | Error creating poll message entity:", error);
			return null;
		}
	}

	static async renderPoll(chatMessage, html, listeners = true) {
		const $html = $(html).addClass("easy-poll");
		const data = chatMessage.getFlag(constants.moduleName, "pollData");
		if (!data) return;

		const isDisplayingResults = game.user.getFlag(constants.moduleName, "pollResults") || [];
		const newData = {
			...deepClone(data),
			message: chatMessage,
			isGM: game.user.isGM,
			canDelete: game.user.isGM,
			results: isDisplayingResults.includes(chatMessage.id),
			poll: chatMessage.id,
			parts: data.parts.map((p) => ({
				...p,
				checked: data.answers.some((a) => a.user === game.user.id && a.label === p.label),
			})),
			voteType: data.voteType ?? "normal",
			voteNumber: data.voteNumber ?? "multiple",
			resultType: data.resultType ?? "open",
		};

		const newHtml = await renderTemplate(`${constants.modulePath}/templates/poll.html`, newData);
		$html.html(newHtml);

		if (!listeners) return;

		html.on("click", "input[type=checkbox], input[type=radio]", (event) => {
			const { answer, poll } = event.currentTarget.dataset;
			const checked = event.currentTarget.checked;
			if (game.user.isGM) Poll.answer(poll, answer, checked, game.user.id);
			else Socket.sendAnswer(poll, answer, checked);
		});

		html.on("click", "button.toggle", async (event) => {
			let poll = event.currentTarget.dataset.poll;
			let isDisplayingResults = game.user.getFlag(constants.moduleName, "pollResults") || [];
			isDisplayingResults = duplicate(isDisplayingResults);

			if (isDisplayingResults.includes(poll)) {
				isDisplayingResults = isDisplayingResults.filter((p) => p !== poll);
			} else {
				isDisplayingResults.push(poll);
			}

			await game.user.setFlag(constants.moduleName, "pollResults", isDisplayingResults);
			this.renderPoll(chatMessage, html, false);
		});

		html.on("click", "button.showResults", async (event) => {
			const poll = game.messages.get(event.currentTarget.dataset.poll);
			const data = poll.getFlag(constants.moduleName, "pollData");
			await poll.setFlag(constants.moduleName, "pollData", { ...data, resultType: "open" });
		});
	}

	static async answer(id, answer, status, user) {
		let poll = game.messages.get(id);
		if (poll) {
			let data = poll.getFlag(constants.moduleName, "pollData");
			if (data) {
				let answers = data.answers;
				// Picks all answers that weren't made by the user
				if (data.voteNumber == "single") answers = answers.filter((a) => a.user !== user);
				// Picks all answers that aren't the same as the answer being added
				else answers = answers.filter((a) => !(a.user === user && a.label === answer));
				answers.push(this.makeAnswer(answer, status, user));
				data.answers = answers;
				data = this.recalculate(data);
				await poll.setFlag(constants.moduleName, "pollData", data);
			}
		} else throw new EasyPollError(game.i18n.format("EasyPolls.console.errors.noPoll"));
	}

	static recalculate(data) {
		data = duplicate(data);

		data.total = data.answers.filter((a) => a.status).length;
		data.parts.forEach((p) => {
			const votes = data.answers.filter((a) => a.status && p.label === a.label);
			p.count = votes.length;
			p.percent = Math.round((p.count / data.total || 0) * 100);
			p.voters = votes
				.map((a) => {
					let user = game.users.get(a.user);
					return { id: user.id, name: user.name, charname: user.charname, color: user.color };
				})
				.sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang, { sensitivity: "base" }));
		});

		return data;
	}

	static makeAnswer(answer, status, user = game.user.id) {
		return {
			label: answer,
			status: status,
			user: user,
		};
	}
}
