export enum PreconditionIdentifier {
	// Guild role checks
	NotReviewer = "notReviewer",
	NotAdmin = "notAdmin",
	Blacklisted = "blacklisted",
	// Context checks
	NotGuild = "notGuild",
	NotCached = "notCached",
	// Limit checks
	PositionsLimit = "positionLimit",
	RolesLimit = "roleLimit",
	QuestionsLimit = "questionsLimit",
	CustomCommandsLimit = "customCommandsLimit",
	// Validation checks
	PositionsValidation = "positionsValidation"
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
