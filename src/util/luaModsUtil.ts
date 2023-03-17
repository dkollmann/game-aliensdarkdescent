import path from 'path';
import { fs, log, util, types } from 'vortex-api';

interface ILogicMod {
    folderName: string;
    enabled: boolean;
}

export let logicMods: ILogicMod[] = util.makeReactive([]);

export async function refreshLogicMods(api: types.IExtensionApi) {
    const state = api.getState();
    const gamePath: string | undefined = state.settings.gameMode.discovered['hogwartslegacy']?.path || undefined;
    if (!gamePath) {
        log('error', 'Error getting game path');
        api.showErrorNotification('Could not refresh logic mods', 'Unable to locate Hogwarts Legacy install folder.');
        return;
    }
    const logicModsPath = path.join(gamePath, 'Phoenix', 'Binaries', 'Win64', 'Mods');
    // Get a list of folders.
    let folderList = [];
    try {
        folderList = await getFolders(logicModsPath);
    }
    catch(err) {
        log('error', 'Could not refresh logic mods', err);
    }
    // Parse the Mods.txt file and filter out any missing entries.
    let savedLoadOrder = [];
    try {
        savedLoadOrder = (await parseManifest(path.join(logicModsPath, 'Mods.txt')))
        .filter(entry => !!folderList.find(f => f.toLowerCase() === entry.folderName.toLowerCase()));
    }
    catch(err) {
        log('error', 'Could not get mods.txt data', err);
    }
    // Interate over the folders and map them into load order entries.
    const newLoadOrder: ILogicMod[] = folderList.map(f => {
        const existing = savedLoadOrder.find(e => e.folderName.toLowerCase() === f.toLowerCase());
        if (existing) return existing;
        else return { folderName: f, enabled: true };
    });

    logicMods = newLoadOrder;

    console.log('New load order', newLoadOrder);

    await writeManifest(newLoadOrder, path.join(logicModsPath, 'mods1.txt'))

    return newLoadOrder;
}

async function getFolders(modsPath: string): Promise<string[]> {
    try {
        const allfiles = await fs.readdirAsync(modsPath);
        const folders = allfiles.filter(f => !path.extname(f));
        const validFolders = [];
        for (const folder of folders) {
            try {
                const stats = await fs.statAsync(path.join(modsPath, folder));
                if (folder.toLowerCase() === 'shared') continue;
                if (stats.isDirectory()) validFolders.push(folder);
            }
            catch(err) {
                log('warn', 'Error in directroy check', err);
            }
        }
        return validFolders;
    }
    catch(err) {
        log('error', 'Error getting folder list for logic mods load order', err);
        return[];
    }
}

async function parseManifest(filePath: string): Promise<ILogicMod[]> {
    // Split into an array by new line, remove comments and blank lines
    try {
        const data = await fs.readFileAsync(filePath, { encoding: 'utf8' });
        const entries = data.split('\r\n').filter(l => l !== '' && !l.startsWith(';'));
        const mods = entries.reduce((prev, e) => {
            const text = e.trim()
            const enabledNumber: number | typeof NaN = parseInt(text.slice(-1));
            const folderName = text.substring(0, text.lastIndexOf(':')).trim();
            if (isNaN(enabledNumber)) {
                log('warn', 'Invalid logic mod entry', e);
                return prev;
            };
            prev.push({ folderName, enabled: enabledNumber === 1 ? true : false });
            return prev;        
        }, []);
        return mods;
    }
    catch(err) {
        log('error', 'Could not parse logic mods manifest', err);
        return [];
    }
}

async function writeManifest(loadOrder: ILogicMod[], filePath: string) {
    loadOrder = loadOrder.filter(l => !['shared', 'keybinds'].includes(l.folderName.toLowerCase()));
    const data = loadOrder.map(e => `${e.folderName} : ${e.enabled ? 1 : 0}`).join('\n');
    const document = `; Logic Mods Load order generated by Vortex\r\n${data}\r\n\r\n; Built-in keybinds, do not move up!\r\nKeybinds : 1`;
    try {
        await fs.writeFileAsync(filePath, document);
    }
    catch(err) {
        log('error', 'Unable to write load order file!', err);
    }
}