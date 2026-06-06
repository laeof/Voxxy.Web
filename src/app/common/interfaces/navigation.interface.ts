export interface AppNavigation {
    navigationGroups: AppNavigationGroup[];
}

export interface AppNavigationGroup {
    groupIcon: string;
    groupTitle: string;
    groupItems: AppNavigationGroup[];
    route?: string;
}