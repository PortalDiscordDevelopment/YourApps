import { Piece, PieceOptions } from "@sapphire/pieces";

export type ModuleOptions = PieceOptions;

export abstract class ModulePiece extends Piece<ModuleOptions> {
	public abstract init(): Promise<void>;
	public abstract destroy(): Promise<void>;
}
