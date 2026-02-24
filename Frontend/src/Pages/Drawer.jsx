import * as React from "react";
import { useState, useEffect } from "react";
import { z } from "zod";
import {
  Box,
  CssBaseline,
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Collapse,
  ThemeProvider,
  styled,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
} from "@mui/material";
import { alpha, createTheme } from "@mui/material/styles";
import { useColorScheme } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import EnhancedEncryptionIcon from "@mui/icons-material/EnhancedEncryption";
import LockResetIcon from "@mui/icons-material/LockReset";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EventIcon from "@mui/icons-material/Event";
import PeopleIcon from "@mui/icons-material/People";
import NotificationsPausedIcon from "@mui/icons-material/NotificationsPaused";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SettingsIcon from "@mui/icons-material/Settings";
import AssignmentIcon from "@mui/icons-material/Assignment";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import WorkIcon from "@mui/icons-material/Work";
import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import ListAltIcon from "@mui/icons-material/ListAlt";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import StoreIcon from "@mui/icons-material/Store";
import Person3Icon from "@mui/icons-material/Person3";
import ContactlessIcon from "@mui/icons-material/Contactless";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import InventoryIcon from "@mui/icons-material/Inventory";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import LocalDrinkIcon from "@mui/icons-material/LocalDrink";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import { Outlet, useNavigate } from "react-router";
import { updatepassword } from "../Services/usermast.services";
import { logoutUser } from "../Services/logout.service";
import { getMenus } from "../Services/drawer.service";
import { showSwal } from "../Components/swal_alert";
import Loading from "../Components/loading";
import theme from "../utils/drawer.theme";
import { decryptData } from "../utils/secureStorage";
import { useMenu } from "../Context/MenuContext";

// ---------------------------------------------------------------------------
// MUI theme instance used only for drag preview styling
// ---------------------------------------------------------------------------
const muiTheme = createTheme();

const drawerWidth = 240;

// ---------------------------------------------------------------------------
// Password validation — requires uppercase, lowercase, digit, special char
// ---------------------------------------------------------------------------
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

/**
 * Zod schema for the Change Password dialog form.
 * Validates all three fields and cross-checks newPassword === confirmPassword.
 */
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(
        strongPasswordRegex,
        "Password must contain uppercase, lowercase, number and special character",
      ),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password must match",
    path: ["confirmPassword"],
  });

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

/** Spacer div that matches the AppBar height — keeps content below the bar */
const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

/** Top app bar — shifts right when the drawer is open */
const AppBar = styled(MuiAppBar)(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  borderRadius: "0 0 16px 16px",
  background:
    theme.palette.mode === "light"
      ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
      : `linear-gradient(135deg, #3a3a3a, #2b2b2b)`,
  color: "#ffffff",
  transition: "all 0.3s ease",
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
  }),
}));

/** Persistent side drawer with rounded right edge */
const Drawer = styled(MuiDrawer)(({ theme }) => ({
  flexShrink: 0,
  "& .MuiDrawer-paper": {
    width: drawerWidth,
    position: "absolute",
    left: 0,
    top: 0,
    height: "100vh",
    borderRight: "none",
    backgroundColor: theme.palette.background.paper,
    borderRadius: "0 16px 16px 0",
    boxShadow: theme.shadows[4],
  },
}));

// ---------------------------------------------------------------------------
// Drag-and-drop preview element
// ---------------------------------------------------------------------------

/**
 * Creates a styled ghost element used as the drag image during drag-and-drop.
 * Appended to document.body temporarily and removed after dragstart.
 *
 * @param {string} text - Label text shown on the drag preview.
 * @returns {HTMLDivElement} The preview DOM element.
 */
export const createDragPreview = (text) => {
  const div = document.createElement("div");
  div.innerText = text;

  Object.assign(div.style, {
    padding: "6px 10px",
    background: alpha(muiTheme.palette.primary.main, 0.7),
    color: muiTheme.palette.primary.contrastText,
    fontSize: muiTheme.typography.body2.fontSize,
    fontFamily: muiTheme.typography.fontFamily,
    borderRadius: muiTheme.shape.borderRadius + "px",
    boxShadow: muiTheme.shadows[4],
    position: "absolute",
    top: "-1000px",
    pointerEvents: "none",
  });

  document.body.appendChild(div);
  return div;
};

// ---------------------------------------------------------------------------
// Icon registry — maps string icon names from the API to MUI icon components
// ---------------------------------------------------------------------------
const iconMap = {
  StoreIcon,
  StorefrontIcon,
  ShoppingCartIcon,
  InventoryIcon,
  CurrencyRupeeIcon,
  LocalDrinkIcon,
  CorporateFareIcon,
  Person3Icon,
  PersonAddIcon,
  PeopleIcon,
  Diversity3Icon,
  ContactlessIcon,
  AssessmentIcon,
  AssignmentIcon,
  SettingsIcon,
  WorkIcon,
  NotificationsIcon,
  NotificationsActiveIcon,
  NotificationsPausedIcon,
  NotificationImportantIcon,
  GroupAddIcon,
  PlaylistAddIcon,
  ListAltIcon,
  ViewModuleIcon,
  AdminPanelSettingsIcon,
  EventIcon,
};

/**
 * Resolves an icon name string to its MUI component and renders it.
 * Falls back to ShoppingCartIcon if the name is not found in iconMap.
 *
 * @param {string} name - Icon name as stored in the menu API response.
 * @param {object} sx - Optional MUI sx style object applied to the icon.
 * @returns {JSX.Element}
 */
const getIcon = (name, sx = {}) => {
  const Cmp = iconMap[name] || ShoppingCartIcon;
  return <Cmp sx={sx} />;
};

/** Rotating set of colors applied to sidebar icons for visual variety */
const iconColors = [
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#10B981", // teal
  "#8B5CF6", // violet
];

/**
 * Renders a menu icon with a color picked by cycling through iconColors.
 *
 * @param {string} iconName - Icon name string from the menu API.
 * @param {number} index - Position index used to select the color.
 * @returns {JSX.Element}
 */
const coloredIcon = (iconName, index) => {
  const color = iconColors[index % iconColors.length];
  return getIcon(iconName, { color });
};

// ---------------------------------------------------------------------------
// MiniDrawer — main layout shell
// ---------------------------------------------------------------------------

/**
 * MiniDrawer
 *
 * Root layout component rendered after login. Provides:
 *  - Top AppBar with theme toggle, admin menu buttons, and profile menu
 *  - Collapsible side drawer with dynamic multi-level menu tree from API
 *  - Drag-and-drop support on all menu levels (module, main, item, sub)
 *  - Change Password dialog with Zod validation
 *  - Logout with backend notification and local session clear
 *  - Outlet for rendering child routes inside the content area
 */
export default function MiniDrawer() {
  const navigate = useNavigate();
  const { mode, setMode } = useColorScheme();
  const { setCurrentMenu } = useMenu();

  // Drawer open/close state
  const [open, setOpen] = useState(false);

  // Dynamic menu tree loaded from the API
  const [menuTree, setMenuTree] = useState([]);

  // Tracks which menu nodes are expanded — keyed by "module-{id}", "main-{id}", "item-{id}"
  const [openMap, setOpenMap] = useState({});

  // Profile avatar dropdown anchor
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  // Admin "ADD MENU" dropdown anchor
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState(null);

  // Change Password dialog state
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Password field visibility toggles
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  // Reads admin flag from local storage — controls admin-only AppBar buttons
  const isAdmin = localStorage.getItem("group_id") === "1";

  // Fetch menu tree on mount
  useEffect(() => {
    fetchMenuItems();
  }, []);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  /**
   * Fetches the dynamic sidebar menu tree for the logged-in user.
   * Uses the user_id stored in localStorage by the login flow.
   */
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const loginId = localStorage.getItem("user_id");
      const response = await getMenus(loginId);
      setMenuTree(response?.items || []);
    } catch (error) {
      console.error("Failed to fetch menu items", error);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Drawer / menu collapse handlers
  // -------------------------------------------------------------------------

  /**
   * Toggles the expanded state of any menu node by its key.
   *
   * @param {string} key - Unique key for the menu node (e.g. "module-3").
   */
  const toggleOpen = (key) => {
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /**
   * Expands the clicked main menu item and collapses all other main items
   * within the same module — enforces single-open-at-a-time per module.
   *
   * @param {object} module - The parent module node.
   * @param {object} main - The main menu item that was clicked.
   */
  const handleMainClick = (module, main) => {
    setOpenMap((prev) => {
      const newState = { ...prev };

      // Collapse all sibling main items and their children
      module.items?.forEach((mItem) => {
        newState[`main-${mItem.id}`] = false;
        mItem.children?.forEach((it) => {
          newState[`item-${it.id}`] = false;
        });
      });

      // Toggle the clicked main item
      newState[`main-${main.id}`] = !prev[`main-${main.id}`];
      return newState;
    });
  };

  // -------------------------------------------------------------------------
  // Navigation handler
  // -------------------------------------------------------------------------

  /**
   * Sets the active menu context in MenuContext and navigates to the menu path.
   * Strips leading slashes from the path before constructing the route.
   *
   * @param {object} menu - Menu node containing path and ID fields.
   */
  const handleListItemClick = (menu) => {
    setCurrentMenu({
      MODULE_MENU_ID: menu.moduleId ?? null,
      MAIN_MENU_ID: menu.mainId ?? null,
      MENU_ITEM_ID: menu.itemId ?? null,
      SUB_MENU_ITEM_ID: menu.subId ?? null,
      actionId: menu.actionId ?? null,
    });

    if (!menu.path) return;

    const cleanPath = menu.path.replace(/^\/+/, "");
    navigate(`/Drawer/${cleanPath}`);
  };

  // -------------------------------------------------------------------------
  // Drag-and-drop handler
  // -------------------------------------------------------------------------

  /**
   * Handles dragstart for any menu level.
   * Creates a styled drag preview, attaches item data to the transfer object,
   * and removes the preview element after the browser captures the drag image.
   *
   * @param {DragEvent} e - The native drag event.
   * @param {object} data - Serializable data payload for the dragged menu item.
   */
  const handleDragStart = (e, data) => {
    const label =
      data.subName || data.itemName || data.mainName || data.moduleName;
    const preview = createDragPreview(`${data.level.toUpperCase()} : ${label}`);

    e.dataTransfer.setDragImage(preview, 10, 10);
    e.dataTransfer.clearData();
    e.dataTransfer.setData("item", JSON.stringify(data));

    setTimeout(() => document.body.removeChild(preview), 0);
  };

  // -------------------------------------------------------------------------
  // Logout handler
  // -------------------------------------------------------------------------

  /**
   * Notifies the backend of logout, then unconditionally clears local and
   * session storage and redirects to the login page.
   */
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout API call failed", err);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      navigate("/", { replace: true });
    }
  };

  // -------------------------------------------------------------------------
  // Change Password dialog handlers
  // -------------------------------------------------------------------------

  /**
   * Validates a single password field in real time as the user types.
   * Updates only the error for the field being edited without re-validating others.
   *
   * @param {string} field - The field name to validate ("currentPassword" | "newPassword" | "confirmPassword").
   * @param {object} values - The full current form state for cross-field checks.
   */
  const validateSingleField = (field, values) => {
    const result = changePasswordSchema.safeParse(values);

    if (!result.success) {
      const issueForField = result.error.issues.find(
        (issue) => issue.path[0] === field,
      );
      setFieldErrors((prev) => ({
        ...prev,
        [field]: issueForField?.message || "",
      }));
    } else {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  /**
   * Calls the update password API and resets the dialog form on success.
   * Separated from handlePasswordUpdate to isolate the API call from
   * validation and alert logic.
   */
  const updatePasswordAPI = async () => {
    try {
      await updatepassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setChangePwdOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setErrorMsg(err?.message || "Password update failed");
    }
  };

  /**
   * Runs full Zod validation on the Change Password form,
   * then calls updatePasswordAPI and shows a success or error alert.
   */
  const handlePasswordUpdate = async () => {
    const result = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      const errors = {};
      result.error.issues.forEach((issue) => {
        errors[issue.path[0]] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      await updatePasswordAPI();
      showSwal({ text: "Password updated successfully", icon: "success" });
    } catch (err) {
      showSwal({
        text: err?.message || "Current password is incorrect",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <ThemeProvider theme={theme}>
        {!mode ? (
          <Box>Loading...</Box>
        ) : (
          <>
            <CssBaseline />

            <Box sx={{ display: "flex" }}>
              {/* Top AppBar — fixed, shifts width when drawer opens */}
              <AppBar position="fixed" open={open}>
                <Toolbar>
                  {/* Drawer open toggle */}
                  <IconButton color="inherit" onClick={() => setOpen(true)}>
                    <MenuIcon />
                  </IconButton>

                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Siri Workbench
                  </Typography>

                  {/* Admin-only navigation buttons */}
                  {isAdmin && (
                    <>
                      <Button
                        color="white"
                        onClick={() => navigate("/Drawer/Group")}
                      >
                        Groups
                      </Button>

                      <Button
                        color="white"
                        onClick={() => navigate("/Drawer/DragAndDrop")}
                      >
                        User Menu Access
                      </Button>

                      {/* ADD MENU dropdown — admin only */}
                      <Button
                        color="inherit"
                        onClick={(e) => setAddMenuAnchorEl(e.currentTarget)}
                      >
                        ADD MENU
                      </Button>

                      <Menu
                        anchorEl={addMenuAnchorEl}
                        open={Boolean(addMenuAnchorEl)}
                        onClose={() => setAddMenuAnchorEl(null)}
                      >
                        <MenuItem
                          onClick={() => {
                            setAddMenuAnchorEl(null);
                            navigate("AddModuleMaster");
                          }}
                        >
                          Add Module
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            setAddMenuAnchorEl(null);
                            navigate("AddMainmenuMaster");
                          }}
                        >
                          Add Main Menu
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            setAddMenuAnchorEl(null);
                            navigate("AddMenuItemMaster");
                          }}
                        >
                          Add Main Menu Items
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            setAddMenuAnchorEl(null);
                            navigate("SubMenuMaster");
                          }}
                        >
                          Add Sub Menu
                        </MenuItem>
                      </Menu>
                    </>
                  )}

                  {/* Theme toggle — switches between light and dark mode */}
                  <IconButton
                    onClick={() => setMode(mode === "light" ? "dark" : "light")}
                    color="inherit"
                  >
                    {mode === "light" ? (
                      <Brightness4Icon />
                    ) : (
                      <Brightness7Icon />
                    )}
                  </IconButton>

                  {/* Profile avatar — opens account menu */}
                  <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                    <Avatar />
                  </IconButton>

                  {/* Account dropdown menu */}
                  <Menu
                    anchorEl={anchorEl}
                    open={isMenuOpen}
                    onClose={() => setAnchorEl(null)}
                  >
                    <MenuItem
                      onClick={() => {
                        setChangePwdOpen(true);
                        setAnchorEl(null);
                      }}
                    >
                      <EnhancedEncryptionIcon
                        sx={{ mr: 1, color: "#c19b00ff" }}
                      />
                      Change Password
                    </MenuItem>

                    <MenuItem
                      onClick={() => {
                        setAnchorEl(null);
                        handleLogout();
                      }}
                    >
                      <ChevronRightIcon color="error" />
                      Logout
                    </MenuItem>
                  </Menu>
                </Toolbar>
              </AppBar>

              {/* Side drawer — persistent, floats over content when open */}
              <Drawer
                variant="persistent"
                anchor="left"
                open={open}
                sx={{ position: "fixed" }}
              >
                <DrawerHeader>
                  <IconButton onClick={() => setOpen(false)}>
                    <ChevronLeftIcon />
                  </IconButton>
                </DrawerHeader>

                <Divider />

                {/* Dynamic menu tree — modules > main items > children > sub menus */}
                <List sx={{ width: "100%" }} component="nav">
                  {menuTree.map((module, index) => {
                    const moduleKey = `module-${module.id}`;
                    const moduleOpen = !!openMap[moduleKey];

                    return (
                      <React.Fragment key={module.id}>
                        {/* Module level row */}
                        <ListItemButton
                          sx={{ pl: 3 }}
                          draggable
                          onDragStart={(e) =>
                            handleDragStart(e, {
                              level: "module",
                              moduleId: module.id,
                              moduleName: module.name,
                              icon: module.icon,
                              items: module.items,
                            })
                          }
                          onClick={() => toggleOpen(moduleKey)}
                        >
                          <ListItemIcon>
                            {coloredIcon(module.icon, index)}
                          </ListItemIcon>
                          <ListItemText primary={module.name} sx={{ ml: -2 }} />
                          {moduleOpen ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>

                        {/* Main menu items — collapse under their module */}
                        <Collapse in={moduleOpen} timeout="auto" unmountOnExit>
                          {module.items?.map((main, index) => {
                            const mainKey = `main-${main.id}`;
                            const mainOpen = !!openMap[mainKey];
                            const hasChildren = main.children?.length > 0;

                            return (
                              <React.Fragment key={main.id}>
                                <List component="div" disablePadding>
                                  <ListItemButton
                                    draggable
                                    onDragStart={(e) =>
                                      handleDragStart(e, {
                                        level: "main",
                                        moduleId: module.id,
                                        moduleName: module.name,
                                        moduleIcon: module.icon,
                                        mainId: main.id,
                                        mainName: main.name,
                                        mainIcon: main.icon,
                                        children: main.children || [],
                                        subMenus: main.subMenus || [],
                                      })
                                    }
                                    onClick={() =>
                                      hasChildren
                                        ? handleMainClick(module, main)
                                        : handleListItemClick({
                                            path: main.path,
                                            moduleId: module.id,
                                            mainId: main.id,
                                            actionId: main.actionId,
                                          })
                                    }
                                  >
                                    <ListItemIcon sx={{ ml: 2 }}>
                                      {coloredIcon(main.icon, index + 1)}
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={main.name}
                                      sx={{ ml: -3 }}
                                      className="calibriFont"
                                    />
                                    {hasChildren &&
                                      (mainOpen ? (
                                        <ExpandLess />
                                      ) : (
                                        <ExpandMore />
                                      ))}
                                  </ListItemButton>
                                </List>

                                {/* Child menu items — collapse under their main item */}
                                <Collapse
                                  in={mainOpen}
                                  timeout="auto"
                                  unmountOnExit
                                >
                                  <List component="div" disablePadding>
                                    {main.children?.map((item, index) => {
                                      const itemKey = `item-${item.id}`;
                                      const itemOpen = !!openMap[itemKey];
                                      const hasSubMenus =
                                        item.subMenus?.length > 0;

                                      return (
                                        <React.Fragment key={item.id}>
                                          <ListItemButton
                                            draggable
                                            onDragStart={(e) =>
                                              handleDragStart(e, {
                                                level: "item",
                                                moduleId: module.id,
                                                moduleName: module.name,
                                                moduleIcon: module.icon,
                                                mainId: main.id,
                                                mainName: main.name,
                                                mainIcon: main.icon,
                                                itemId: item.id,
                                                itemName: item.name,
                                                icon: item.icon,
                                                subMenus: item.subMenus,
                                              })
                                            }
                                            onClick={() =>
                                              hasSubMenus
                                                ? toggleOpen(itemKey)
                                                : handleListItemClick({
                                                    path: item.path,
                                                    moduleId: module.id,
                                                    mainId: main.id,
                                                    itemId: item.id,
                                                    actionId: item.actionId,
                                                  })
                                            }
                                          >
                                            <ListItemIcon sx={{ ml: 4 }}>
                                              {coloredIcon(
                                                item.icon,
                                                index + 2,
                                              )}
                                            </ListItemIcon>
                                            <ListItemText
                                              sx={{ ml: -3 }}
                                              primary={item.name}
                                            />
                                            {hasSubMenus &&
                                              (itemOpen ? (
                                                <ExpandLess />
                                              ) : (
                                                <ExpandMore />
                                              ))}
                                          </ListItemButton>

                                          {/* Sub menu items — deepest level, no further nesting */}
                                          {hasSubMenus && (
                                            <Collapse
                                              in={itemOpen}
                                              timeout="auto"
                                              unmountOnExit
                                            >
                                              <List
                                                component="div"
                                                disablePadding
                                              >
                                                {item.subMenus.map(
                                                  (sub, index) => (
                                                    <ListItemButton
                                                      key={sub.id}
                                                      draggable
                                                      onDragStart={(e) =>
                                                        handleDragStart(e, {
                                                          level: "sub",
                                                          moduleId: module.id,
                                                          moduleName:
                                                            module.name,
                                                          moduleIcon:
                                                            module.icon,
                                                          mainId: main.id,
                                                          mainName: main.name,
                                                          mainIcon: main.icon,
                                                          itemId: item.id,
                                                          itemName: item.name,
                                                          itemIcon: item.icon,
                                                          subId: sub.id,
                                                          subName: sub.name,
                                                          icon: sub.icon,
                                                        })
                                                      }
                                                      onClick={() =>
                                                        handleListItemClick({
                                                          path: sub.path,
                                                          moduleId: module.id,
                                                          mainId: main.id,
                                                          itemId: item.id,
                                                          subId: sub.id,
                                                          actionId:
                                                            sub.actionId,
                                                        })
                                                      }
                                                    >
                                                      <ListItemIcon
                                                        sx={{ ml: 6 }}
                                                      >
                                                        {coloredIcon(
                                                          sub.icon,
                                                          index,
                                                        )}
                                                      </ListItemIcon>
                                                      <ListItemText
                                                        sx={{ ml: -3 }}
                                                        primary={sub.name}
                                                      />
                                                    </ListItemButton>
                                                  ),
                                                )}
                                              </List>
                                            </Collapse>
                                          )}
                                        </React.Fragment>
                                      );
                                    })}
                                  </List>
                                </Collapse>
                              </React.Fragment>
                            );
                          })}
                        </Collapse>
                      </React.Fragment>
                    );
                  })}
                </List>
              </Drawer>

              {/* Main content area — shifts right when drawer is open */}
              <Box
                component="main"
                sx={{
                  p: 2,
                  width: "100%",
                  transition: "all 0.3s ease",
                  marginLeft: open ? `${drawerWidth}px` : "0px",
                }}
              >
                <DrawerHeader />
                <Outlet />
              </Box>
            </Box>

            {/* Change Password dialog */}
            <Dialog
              open={changePwdOpen}
              onClose={() => setChangePwdOpen(false)}
              maxWidth="xs"
              fullWidth
              sx={{ mt: -20 }}
            >
              {/* Dialog header with gradient background */}
              <DialogTitle
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "linear-gradient(135deg, #6F60C1, #8578e6)",
                  color: "#fff",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LockResetIcon />
                  Change Password
                </Box>

                <IconButton
                  onClick={() => setChangePwdOpen(false)}
                  sx={{ color: "#fff" }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>

              <DialogContent sx={{ mt: 2 }}>
                {loading && <Loading />}

                {/* Current password field */}
                <TextField
                  label="Current Password"
                  type="password"
                  fullWidth
                  margin="dense"
                  value={currentPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCurrentPassword(value);
                    validateSingleField("currentPassword", {
                      currentPassword: value,
                      newPassword,
                      confirmPassword,
                    });
                  }}
                  error={!!fieldErrors.currentPassword}
                  helperText={fieldErrors.currentPassword}
                />

                {/* New password field */}
                <TextField
                  label="New Password"
                  type={showNew ? "text" : "password"}
                  fullWidth
                  margin="dense"
                  value={newPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewPassword(value);
                    validateSingleField("newPassword", {
                      currentPassword,
                      newPassword: value,
                      confirmPassword,
                    });
                  }}
                  error={!!fieldErrors.newPassword}
                  helperText={fieldErrors.newPassword}
                />

                {/* Confirm new password field */}
                <TextField
                  label="Confirm New Password"
                  type={showConfirm ? "text" : "password"}
                  fullWidth
                  margin="dense"
                  value={confirmPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setConfirmPassword(value);
                    validateSingleField("confirmPassword", {
                      currentPassword,
                      newPassword,
                      confirmPassword: value,
                    });
                  }}
                  error={!!fieldErrors.confirmPassword}
                  helperText={fieldErrors.confirmPassword}
                />

                {/* API-level error message shown below fields */}
                {errorMsg && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {errorMsg}
                  </Typography>
                )}

                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}
                >
                  <Button
                    variant="contained"
                    onClick={handlePasswordUpdate}
                    sx={{
                      backgroundColor: "#6F60C1",
                      "&:hover": { backgroundColor: "#5b4fc7" },
                    }}
                  >
                    Update
                  </Button>
                </Box>
              </DialogContent>
            </Dialog>
          </>
        )}
      </ThemeProvider>
    </>
  );
}
