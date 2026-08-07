export function resolvePickerGroups(myGroups, isSuperAdmin, flagKey = null) {
    const filtered = flagKey ? myGroups.filter((g) => !!g[flagKey]) : myGroups;
    return {
        eligible: filtered,
        needsPicker: filtered.length > 1,
        singleGroupId: filtered.length === 1 ? filtered[0].id : null,
        canBroadcastGlobally: isSuperAdmin,
    };
}
