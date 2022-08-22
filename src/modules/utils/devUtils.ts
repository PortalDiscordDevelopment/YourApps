import { ApplyOptions } from "@sapphire/decorators";
import { ModuleOptions, ModulePiece } from "../../structures/piece";
import { request } from "undici";

@ApplyOptions<ModuleOptions>({
	name: "dev-utils"
})
export class DevUtilsModule extends ModulePiece {
	public async haste(data: string): Promise<string> {
		const { statusCode, body } = await request(
			"https://haste.tyman.systems/documents",
			{
				body: data,
				method: "POST"
			}
		);

		if (statusCode != 200) throw new Error("Uploading to haste failed");
		return await body
			.json()
			.then(
				(response: { key: string }) =>
					`https://haste.tyman.systems/${response.key}`
			);
	}
}
