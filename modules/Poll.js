import constants from "./constants.mjs";
import Socket from "./Socket.js";
import EasyPollError from "./utility/Error.js";

export default class Poll extends ChatMessage {
	static async create(data, options = {}) {
		data = {
			total: 0,
			question: data.question,
			parts: data.parts.map((p) => {
				return { label: p, percent: 0, count: 0 };
			}),
			answers: [],
			voteType: data?.voteType || "normal",
			voteNumber: data?.voteNumber || "multiple",
			resultType: data?.resultType || "open",
		};
		let message = await renderTemplate(`${constants.modulePath}/templates/poll.html`, data);

		let messageData = {
			content: message,
		};

		let messageEntity = await super.create(messageData, options);
		await messageEntity.setFlag(constants.moduleName, "isPoll", true);
		await messageEntity.setFlag(constants.moduleName, "pollData", data);

		return messageEntity;
	}

	static async renderPoll(chatMessage, html, listeners = true) {
		$(html).addClass("easy-poll");
		let data = chatMessage.getFlag(constants.moduleName, "pollData");
		if (!data) return;

		let isDisplayingResults = game.user.getFlag(constants.moduleName, "pollResults") || [];
		data = duplicate(data);
		data.isGM = game.user.isGM;
		data.results = game.user.isGM || isDisplayingResults.includes(chatMessage.id);
		data.poll = chatMessage.id;
		data.parts.forEach((p) => {
			let answer = data.answers.find((a) => a.user === game.user.id && a.label === p.label);
			p.checked = answer ? answer.status : false;
		});
		if (data?.type) delete data.type;
		if (!data?.voteType) data.voteType = "normal";
		if (!data?.voteNumber) data.voteNumber = "multiple";
		if (!data?.resultType) data.resultType = "open";

		let newHtml = await renderTemplate(`${constants.modulePath}/templates/poll.html`, data);
		$(html).find(".message-content").html(newHtml);

		if (!listeners) return;

		html.on("click", "input[type=checkbox]", (event) => {
			let answer = event.currentTarget.dataset.answer;
			let poll = event.currentTarget.dataset.poll;
			let checked = event.currentTarget.checked;
			Socket.sendAnswer(poll, answer, checked);
		});
		html.on("click", "input[type=radio]", (event) => {
			let answer = event.currentTarget.dataset.answer;
			let poll = event.currentTarget.dataset.poll;
			let checked = event.currentTarget.checked;
			Socket.sendAnswer(poll, answer, checked);
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
				data = await this.recalculate(data);

				// await poll.unsetFlag(constants.moduleName, "pollData");
				await poll.setFlag(constants.moduleName, "pollData", data);
				return;
			}
		}
		throw new EasyPollError(game.i18n.format("EasyPolls.console.errors.noPoll"));
	}

	static async recalculate(data) {
		data = duplicate(data);

		data.total = data.answers.filter((a) => a.status).length;
		data.parts.forEach((p) => {
			const votes = data.answers.filter((a) => p.label === a.label && a.status === true);
			p.count = votes.length;
			p.percent = Math.round((p.count / data.total || 0) * 100);
			p.voters = votes.map((a) => {
				let user = game.users.get(a.user);
				return { id: user.id, name: user.data.name, charname: user.charname, color: user.data.color };
			});
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
