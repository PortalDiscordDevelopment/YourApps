export enum PreconditionIdentifier {
	NotReviewer = "notReviewer",
	NotAdmin = "notAdmin",
	Blacklisted = "blacklisted",
	NotGuild = "notGuild",
	NotCached = "notCached",
	PositionLimit = "positionLimit",
	RoleLimit = "roleLimit",
	QuestionsLimit = "questionsLimit",
	customCommandsLimit = "customCommandsLimit"
}

export enum StandardLimits {
	Positions = 10,
	Roles = 10,
	Questions = 25,
	CustomCommands = 3
}

// TODO Allow higher limits with pagination in commands
export enum PremiumLimits {
	Positions = 25,
	Roles = Infinity,
	Questions = 25,
	CustomCommands = 75
}
