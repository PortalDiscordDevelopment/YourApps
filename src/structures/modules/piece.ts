import { Piece, PieceOptions } from "@sapphire/pieces";

export type ModuleOptions = PieceOptions;

export abstract class ModulePiece extends Piece<ModuleOptions> {
	public init?(): Promise<void>;
	public destroy?(): Promise<void>;
}