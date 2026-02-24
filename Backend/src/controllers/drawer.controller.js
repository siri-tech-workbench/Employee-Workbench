const {
    DatabaseHandler,
    ApiError,
    ApiResponse,
    asyncHandler,
} = require("../utils");

/**
 * Normalises a navigation path value.
 * Returns null if the value is null, undefined, or the string "null".
 *
 * @param {*} p - Raw path value from the database row
 * @returns {string|null}
 */
const cleanPath = (p) =>
    p === null || p === undefined || p === "null" ? null : p;

/**
 * Converts a position value to a number for sorting.
 * Returns 999 (sorts to end) if the value is not a valid number.
 *
 * @param {*} x - Raw position value from the database row
 * @returns {number}
 */
const posVal = (x) => {
    const n = Number(x);
    return Number.isNaN(n) ? 999 : n;
};

/**
 * GET /menus?user_id=:user_id
 * Returns the full nested menu tree for a given user based on their access permissions.
 *
 * Tree structure: Module > Main Menu > Menu Item > Sub Menu Item
 * Each level includes id, name, icon, path, position, and actionId.
 *
 * Note: Column names like MENUE_ITEM_ID, SUB_MENUE_ITEM_ID are intentional —
 * they reflect the actual database schema spelling and must not be changed.
 */
const getMenus = asyncHandler(async (req, res) => {
    try {
        const db = new DatabaseHandler();
        const user_id = Number(req.query.user_id);

        if (!req.query.user_id || isNaN(user_id)) {
            throw new ApiError(400, "Valid user_id is required");
        }

        // Fetches all menu access rows for this user across all levels in a single query.
        // Rows are ordered so modules, mains, items, and submenus are grouped correctly.
        const query = `
      SELECT
        mm.module_menu_id,
        mm.module_name,
        mm.icon                       AS module_icon,

        mn.main_menu_id,
        mn.main_menu_name,
        mn.icon                       AS main_icon,
        mn.position                   AS main_position,
        mn.page_name_navigation       AS main_page,

        mi.menue_item_id,
        mi.menue_item_name,
        mi.icon                       AS item_icon,
        mi.page_name_navigation       AS item_page,
        mi.position                   AS item_position,

        sm.sub_menue_item_id,
        sm.sub_menue_name,
        sm.icon                       AS sub_icon,
        sm.page_name_navigation       AS sub_page,
        sm.position                   AS sub_position,

        uma.action_id                 AS ACTION_ID

      FROM user_menu_access uma
      JOIN module_menu mm
           ON mm.module_menu_id = uma.module_menu_id

      LEFT JOIN main_menu mn
           ON mn.main_menu_id = uma.main_menu_id

      LEFT JOIN menue_items mi
           ON mi.menue_item_id = uma.menu_item_id

      LEFT JOIN sub_menue_items sm
           ON sm.sub_menue_item_id = uma.sub_menu_item_id

      WHERE uma.user_id = :user_id

      ORDER BY
        mm.module_menu_id,
        NVL(mn.position, 999),
        NVL(mi.position, 999),
        NVL(sm.position, 999)
    `;

        const result = await db.executeQuery(query, { user_id }, "siri_db");
        const rows = result.rows;

        // Build the nested menu tree from the flat query result.
        // _mainMap and _itemMap are temporary lookup maps used during construction
        // to avoid duplicate entries — they are deleted from the final output below.
        const modulesMap = {};

        for (const r of rows) {
            // Module level — create the module node if not already in the map
            let module = modulesMap[r.MODULE_MENU_ID];
            if (!module) {
                module = {
                    id: r.MODULE_MENU_ID,
                    name: r.MODULE_NAME,
                    icon: r.MODULE_ICON,
                    items: [],
                    _mainMap: {},
                };
                modulesMap[r.MODULE_MENU_ID] = module;
            }

            // Skip rows where the main menu is not assigned to this user
            if (!r.MAIN_MENU_ID) continue;

            // Main menu level — create the main menu node if not already in the map
            let main = module._mainMap[r.MAIN_MENU_ID];
            if (!main) {
                main = {
                    id: r.MAIN_MENU_ID,
                    name: r.MAIN_MENU_NAME,
                    icon: r.MAIN_ICON,
                    path: cleanPath(r.MAIN_PAGE),
                    position: r.MAIN_POSITION,
                    actionId: r.ACTION_ID ?? null,
                    children: [],
                    _itemMap: {},
                };
                module._mainMap[r.MAIN_MENU_ID] = main;
                module.items.push(main);
            }

            // Main menu with no child items — update actionId and move to the next row
            if (!r.MENUE_ITEM_ID) {
                main.actionId = r.ACTION_ID ?? null;
                continue;
            }

            // Menu item level — create the item node if not already in the map
            let item = main._itemMap[r.MENUE_ITEM_ID];
            if (!item) {
                item = {
                    id: r.MENUE_ITEM_ID,
                    name: r.MENUE_ITEM_NAME,
                    icon: r.ITEM_ICON,
                    path: cleanPath(r.ITEM_PAGE),
                    position: r.ITEM_POSITION,
                    actionId: r.ACTION_ID ?? null,
                    subMenus: [],
                };
                main._itemMap[r.MENUE_ITEM_ID] = item;
                main.children.push(item);
            }

            // Sub menu level — append if not already present under this item
            if (r.SUB_MENUE_ITEM_ID) {
                const alreadyAdded = item.subMenus.some((s) => s.id === r.SUB_MENUE_ITEM_ID);
                if (!alreadyAdded) {
                    item.subMenus.push({
                        id: r.SUB_MENUE_ITEM_ID,
                        name: r.SUB_MENUE_NAME,
                        icon: r.SUB_ICON,
                        path: cleanPath(r.SUB_PAGE),
                        position: r.SUB_POSITION,
                        actionId: r.ACTION_ID ?? null,
                    });
                }
            }
        }

        // Sort all levels by position and remove the temporary internal maps
        // before returning the final tree to the client
        const modulesTree = Object.values(modulesMap).map((m) => {
            m.items.sort((a, b) => posVal(a.position) - posVal(b.position));

            m.items.forEach((main) => {
                main.children.sort((a, b) => posVal(a.position) - posVal(b.position));

                main.children.forEach((item) => {
                    item.subMenus.sort((a, b) => posVal(a.position) - posVal(b.position));
                });

                delete main._itemMap;
            });

            delete m._mainMap;
            return m;
        });

        return res.json(new ApiResponse(200, modulesTree));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

module.exports = { getMenus };