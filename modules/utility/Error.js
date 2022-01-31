export default class EasyPollError extends Error {
	constructor(error) {
		error = `Easy Polls | ${error}`;
		super(error);
	}
}
