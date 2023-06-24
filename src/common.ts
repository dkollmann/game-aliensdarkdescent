import * as path from 'path';

export const GAME_ID = 'aliensdarkdescent';
export const EXECUTABLE = "AliensDarkDescentGameSteam-Win64-Shipping.exe"; // path to executable, relative to game root
export const GAMENAME = "ASF";
export const EPIC_ID = "";
export const STEAM_ID = "1150440";


export const MODSFOLDER_PATH = path.join("ASF", "Content", "Paks", "~mods"); // relative to game root
export const MOVIESMOD_PATH = path.join("ASF", "Content"); // relative to game root, can't be /movies as we need to add pak files too sometimes

export const MOVIES_EXTENSION = ".bk2";
export const PAK_EXTENSIONS = [".pak", ".utoc", ".ucas"];
export const IGNORE_CONFLICTS = ["ue4sslogicmod.info", ".ue4sslogicmod", ".logicmod"];
export const IGNORE_DEPLOY = [path.join('**', 'enabled.txt')];
export const STOP_PATTERNS = ["[^/]*\\.pak$"];