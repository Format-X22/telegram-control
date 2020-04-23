export class Collection {
    public static rawCommandsToMap(array: Array<string>): Map<string, string> {
        const commands: Array<Array<string>> = array.reduce(
            (acc: Array<Array<string>>, item: string): Array<Array<string>> => {
                if (acc[acc.length - 1].length === 2) {
                    acc.push([]);
                }

                acc[acc.length - 1].push(item);

                return acc;
            },
            [[]]
        );

        if (commands[0].length === 0) {
            return new Map();
        }

        return new Map(commands as Array<[string, string]>);
    }
}
