import React, { useState, useEffect, useRef } from "react";
import {
  Autocomplete,
  TextField,
  Paper,
  Typography,
  Grid,
  Chip,
  Box,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TableCell,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ExpandMore, ChevronRight } from "@mui/icons-material";
import { getMenus } from "../../../Services/drawer.service";
import CloseIcon from "@mui/icons-material/Close";
import Modal from "@mui/material/Modal";
import {
  fetchUsers_Drag,
  postUsers_Drag,
  fetchUsersactions_Drag,
  deleteUsers_Drag,
  getUsersbyGroupID_Drag,
} from "../../../Services/dragAndDrop.services";
import { getGroupMaster } from "../../../Services/groupMaster.services";
import {
  showPostError,
  showPostSuccess,
  deleteAlert,
  deleteErrorAlert,
  showDragAlert,
} from "../../../Components/swal_alert";
import {
  Store as StoreIcon,
  Storefront as StorefrontIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  LocalDrink as LocalDrinkIcon,
  CorporateFare as CorporateFareIcon,
  Person3 as Person3Icon,
  PersonAdd as PersonAddIcon,
  People as PeopleIcon,
  Diversity3 as Diversity3Icon,
  Contactless as ContactlessIcon,
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  Work as WorkIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsPaused as NotificationsPausedIcon,
  NotificationImportant as NotificationImportantIcon,
  GroupAdd as GroupAddIcon,
  PlaylistAdd as PlaylistAddIcon,
  ListAlt as ListAltIcon,
  ViewModule as ViewModuleIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Event as EventIcon,
} from "@mui/icons-material";

// Maps icon name strings returned by the API to their corresponding MUI icon components.
// Used by ColoredIcon to dynamically render the correct icon in the tree view.
const iconMap = {
  StoreIcon: StoreIcon,
  StorefrontIcon: StorefrontIcon,
  ShoppingCartIcon: ShoppingCartIcon,
  InventoryIcon: InventoryIcon,
  CurrencyRupeeIcon: CurrencyRupeeIcon,
  LocalDrinkIcon: LocalDrinkIcon,
  CorporateFareIcon: CorporateFareIcon,
  Person3Icon: Person3Icon,
  PersonAddIcon: PersonAddIcon,
  PeopleIcon: PeopleIcon,
  Diversity3Icon: Diversity3Icon,
  ContactlessIcon: ContactlessIcon,
  AssessmentIcon: AssessmentIcon,
  AssignmentIcon: AssignmentIcon,
  SettingsIcon: SettingsIcon,
  WorkIcon: WorkIcon,
  NotificationsIcon: NotificationsIcon,
  NotificationsActiveIcon: NotificationsActiveIcon,
  NotificationsPausedIcon: NotificationsPausedIcon,
  NotificationImportantIcon: NotificationImportantIcon,
  GroupAddIcon: GroupAddIcon,
  PlaylistAddIcon: PlaylistAddIcon,
  ListAltIcon: ListAltIcon,
  ViewModuleIcon: ViewModuleIcon,
  AdminPanelSettingsIcon: AdminPanelSettingsIcon,
  EventIcon: EventIcon,
};

// Rotating color palette applied to tree node icons based on their depth index.
const iconColors = ["#F59E0B", "#3B82F6", "#10B981", "#8B5CF6"];

// Renders a named MUI icon with a color selected from the palette by index.
// Falls back to ShoppingCartIcon if the icon name is not found in iconMap.
const ColoredIcon = ({ name, index }) => {
  const IconComponent = iconMap[name] || ShoppingCartIcon;
  const color = iconColors[index % iconColors.length];
  return <IconComponent sx={{ color, fontSize: 20 }} />;
};

// Recursively renders a collapsible tree node with an icon and label.
// Nodes that have children display an expand/collapse arrow on click.
const TreeNode = ({ node, level = 0, iconIndex = 0 }) => {
  const hasChildren = node.children && Object.keys(node.children).length > 0;
  const [open, setOpen] = useState(true);

  return (
    <Box sx={{ ml: level * 2 }}>
      <Typography
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: hasChildren ? "pointer" : "default",
        }}
        onClick={hasChildren ? () => setOpen(!open) : undefined}
      >
        {/* Show collapse arrow only for nodes that have children */}
        {hasChildren ? open ? <ExpandMore /> : <ChevronRight /> : null}

        <ColoredIcon name={node.icon} index={iconIndex} />

        <span style={{ marginLeft: 6 }}>{node.name}</span>
      </Typography>

      {/* Recursively render child nodes when the node is expanded */}
      {hasChildren &&
        open &&
        Object.values(node.children).map((child, idx) => (
          <TreeNode
            key={child.id}
            node={child}
            level={level + 1}
            iconIndex={iconIndex + idx + 1}
          />
        ))}
    </Box>
  );
};

// Styles for the group users preview modal dialog.
const style = {
  position: "absolute",
  top: "40%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  maxWidth: "90%",
  bgcolor: "background.paper",
  border: "2px solid #2f045dff",
  borderRadius: "25px",
  boxShadow: 24,
  p: 2,
};

// Permission assignment screen that allows dragging menu items from a tree
// into a drop zone, then assigning UI action privileges per item for a
// selected user or group.
const DragAndDrop = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActions, setUserActions] = useState([]);
  const [droppedItems, setDroppedItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupUsers, setGroupUsers] = useState([]);
  const [open, setOpen] = useState(false);

  // Fetches all users from the API and maps them to a flat id/name shape
  // suitable for the user autocomplete dropdown.
  const getUsers = async () => {
    const res = await fetchUsers_Drag();
    const safeUsers = (res?.items || [])
      .filter((u) => u.USER_ID && u.LOGIN_ID)
      .map((u) => ({
        id: u.USER_ID,
        name: u.LOGIN_ID,
      }));
    setUsers(safeUsers);
  };

  // Fetches the group master list used to populate the group autocomplete dropdown.
  const getGroupMasterList = async () => {
    try {
      const res = await getGroupMaster();
      setGroups(res?.items || []);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetches available UI actions (e.g. View, Edit, Delete) used as radio
  // button options in the permissions table.
  const getUserActions = async () => {
    const res = await fetchUsersactions_Drag();
    setUserActions(
      (res?.items || []).map((u) => ({ id: u.ACTION, name: u.ACTION_NAME })),
    );
  };

  // Fetches the list of users belonging to a specific group,
  // used for the group preview modal and group-level permission assignment.
  const fetchUserByGroupId = async (groupId) => {
    try {
      const res = await getUsersbyGroupID_Drag(groupId);
      setGroupUsers(res?.items || []);
    } catch (error) {
      console.error(error);
    }
  };

  // Load users, actions, and group list on component mount.
  useEffect(() => {
    getUsers();
    getUserActions();
    getGroupMasterList();
  }, []);

  // Reload group users whenever the selected group changes.
  useEffect(() => {
    if (selectedGroup?.GROUP_ID) {
      fetchUserByGroupId(selectedGroup.GROUP_ID);
    } else {
      setGroupUsers([]);
    }
  }, [selectedGroup]);

  // Flattens the user's existing menu tree into the dropped items format so that
  // pre-assigned permissions are shown in the permissions table on user selection.
  const attachActionIdsToDropped = (tree) => {
    const items = [];

    tree.forEach((module) => {
      module.items?.forEach((main) => {
        // Main menu level: add row only if there are no child items
        if (!main.children?.length) {
          items.push({
            moduleId: module.id,
            moduleName: module.name,
            moduleIcon: module.icon,
            mainId: main.id,
            mainName: main.name,
            mainIcon: main.icon,
            actionId: main.actionId ?? null,
          });
        }

        main.children?.forEach((item) => {
          // Item level: add row only if there are no submenus
          if (!item.subMenus?.length) {
            items.push({
              moduleId: module.id,
              moduleName: module.name,
              moduleIcon: module.icon,
              mainId: main.id,
              mainName: main.name,
              mainIcon: main.icon,
              itemId: item.id,
              itemName: item.name,
              itemIcon: item.icon,
              actionId: item.actionId ?? null,
            });
          }

          // Submenu level: always add a row for each submenu entry
          item.subMenus?.forEach((sub) => {
            items.push({
              moduleId: module.id,
              moduleName: module.name,
              moduleIcon: module.icon,
              mainId: main.id,
              mainName: main.name,
              mainIcon: main.icon,
              itemId: item.id,
              itemName: item.name,
              itemIcon: item.icon,
              subId: sub.id,
              subName: sub.name,
              subIcon: sub.icon,
              actionId: sub.actionId ?? null,
            });
          });
        });
      });
    });

    return items;
  };

  // Fetches the selected user's existing menu permissions and populates
  // the dropped items table with their pre-assigned action IDs.
  const getUserMenus = async () => {
    try {
      const res = await getMenus(selectedUser?.id);
      const mapped = attachActionIdsToDropped(res?.items || []);
      setDroppedItems(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  // Reload user menu permissions whenever the selected user changes.
  useEffect(() => {
    if (selectedUser?.id) {
      setDroppedItems([]);
      getUserMenus();
    }
  }, [selectedUser]);

  // Allows drag events to pass over the drop zone.
  const handleDragOver = (e) => e.preventDefault();

  // Expands a dropped tree node into flat permission rows based on its level.
  // Module expands all descendants; main expands its children; item expands
  // its submenus; sub adds a single row.
  const expandDroppedNode = (node) => {
    const rows = [];

    // Module level: expand all mains, items, and submenus recursively
    if (node.level === "module") {
      node.items?.forEach((main) => {
        rows.push({
          moduleId: node.moduleId,
          moduleName: node.moduleName,
          moduleIcon: node.moduleIcon,
          mainId: main.id,
          mainName: main.name,
          mainIcon: main.icon,
        });

        main.children?.forEach((item) => {
          rows.push({
            moduleId: node.moduleId,
            moduleName: node.moduleName,
            mainId: main.id,
            mainName: main.name,
            itemId: item.id,
            itemName: item.name,
            itemIcon: item.icon,
          });

          item.subMenus?.forEach((sub) => {
            rows.push({
              moduleId: node.moduleId,
              moduleName: node.moduleName,
              mainId: main.id,
              mainName: main.name,
              itemId: item.id,
              itemName: item.name,
              subId: sub.id,
              subName: sub.name,
              subIcon: sub.icon,
            });
          });
        });
      });
    }

    // Main menu level: add the main row first, then expand its children
    if (node.level === "main") {
      rows.push({
        moduleId: node.moduleId,
        moduleName: node.moduleName,
        moduleIcon: node.moduleIcon,
        mainId: node.mainId,
        mainName: node.mainName,
        mainIcon: node.mainIcon,
      });

      node.children?.forEach((item) => {
        rows.push({
          moduleId: node.moduleId,
          moduleName: node.moduleName,
          mainId: node.mainId,
          mainName: node.mainName,
          itemId: item.id,
          itemName: item.name,
          itemIcon: item.icon,
        });

        item.subMenus?.forEach((sub) => {
          rows.push({
            moduleId: node.moduleId,
            moduleName: node.moduleName,
            mainId: node.mainId,
            mainName: node.mainName,
            itemId: item.id,
            itemName: item.name,
            subId: sub.id,
            subName: sub.name,
            subIcon: sub.icon,
          });
        });
      });
    }

    // Item level: add the item row first, then expand its submenus
    if (node.level === "item") {
      rows.push({
        moduleId: node.moduleId,
        moduleName: node.moduleName,
        moduleIcon: node.moduleIcon,
        mainId: node.mainId,
        mainName: node.mainName,
        mainIcon: node.mainIcon,
        itemId: node.itemId,
        itemName: node.itemName,
        itemIcon: node.itemIcon,
      });

      node.subMenus?.forEach((sub) => {
        rows.push({
          moduleId: node.moduleId,
          moduleName: node.moduleName,
          mainId: node.mainId,
          mainName: node.mainName,
          itemId: node.itemId,
          itemName: node.itemName,
          subId: sub.id,
          subName: sub.name,
          subIcon: sub.icon,
        });
      });
    }

    // Submenu level: single leaf row with no further expansion
    if (node.level === "sub") {
      rows.push(node);
    }

    return rows;
  };

  // Generates a stable unique string key for a dropped item
  // composed of its module, main, item, and sub IDs.
  const getUniqueKey = (item) =>
    `${item.moduleId ?? ""}-${item.mainId ?? ""}-${item.itemId ?? ""}-${
      item.subId ?? ""
    }`;

  // Handles the drop event on the drop zone.
  // Parses the dragged node data, expands it into flat rows,
  // and prepends only non-duplicate rows to the dropped items list.
  const handleDrop = (e) => {
    e.preventDefault();

    const raw = e.dataTransfer.getData("item");
    if (!raw) return;

    const droppedData = JSON.parse(raw);
    const expandedRows = expandDroppedNode(droppedData);

    if (expandedRows.length === 0) return;

    let duplicateFound = false;

    setDroppedItems((prev) => {
      const existingKeys = new Set(prev.map(getUniqueKey));
      const newRows = [];

      expandedRows.forEach((row) => {
        const key = getUniqueKey(row);
        if (existingKeys.has(key)) {
          duplicateFound = true;
        } else {
          newRows.push(row);
        }
      });

      // New items are prepended so they appear at the top of the table
      return [...newRows, ...prev];
    });

    if (duplicateFound) {
      showDragAlert({
        icon: "warning",
        title: "This items are already exist",
        text: "You cannot add items that already exist.",
      });
    }
  };

  // Builds a nested tree structure from the flat dropped items list
  // for display in the right-side tree view panel.
  const buildTree = () => {
    const tree = {};

    droppedItems.forEach((i) => {
      // Create module node if it does not already exist
      if (!tree[i.moduleId]) {
        tree[i.moduleId] = {
          id: i.moduleId,
          name: i.moduleName,
          icon: i.moduleIcon || "StoreIcon",
          children: {},
        };
      }

      // Create main menu node under its module if it does not already exist
      if (i.mainId) {
        if (!tree[i.moduleId].children[i.mainId]) {
          tree[i.moduleId].children[i.mainId] = {
            id: i.mainId,
            name: i.mainName,
            icon: i.mainIcon || "Person3Icon",
            children: {},
          };
        }
      }

      // Create item node under its main menu if it does not already exist
      if (i.itemId && i.mainId) {
        const mainNode = tree[i.moduleId].children[i.mainId];
        if (!mainNode.children[i.itemId]) {
          mainNode.children[i.itemId] = {
            id: i.itemId,
            name: i.itemName,
            icon: i.itemIcon || "ContactlessIcon",
            children: {},
          };
        }
      }

      // Create submenu leaf node under its item
      if (i.subId && i.itemId && i.mainId) {
        const itemNode = tree[i.moduleId].children[i.mainId].children[i.itemId];
        itemNode.children[i.subId] = {
          id: i.subId,
          name: i.subName,
          icon: i.subIcon || "AssessmentIcon",
        };
      }
    });

    return tree;
  };

  // Updates the actionId for a specific dropped item row when the user
  // selects a radio button privilege option. Converts the string value
  // from RadioGroup to a number, or null if empty.
  const handleActionChange = (index, actionId) => {
    const parsed = actionId === "" ? null : Number(actionId);
    setDroppedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, actionId: parsed } : item,
      ),
    );
  };

  // Normalizes a value to a number suitable for the API payload.
  // Returns null for undefined, null, empty string, or non-numeric values.
  const normDb = (v) => {
    if (v === undefined || v === null) return null;
    if (v === "null" || v === "undefined" || v === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  // Validates selections, deduplicates permissions, and posts the final
  // permission payload for the target user or group.
  const postData = async () => {
    if (!selectedUser && !selectedGroup)
      return showPostError("Please select a user or a group.");

    if (droppedItems.length === 0)
      return showPostError("Please drag and drop a menu item.");

    if (droppedItems.some((item) => item.actionId == null))
      return showPostError("Please select an action for all items.");

    // Determine the list of target users based on single user or group mode
    let targetUsers = [];

    if (selectedUser) {
      targetUsers = [{ USER_ID: selectedUser.id }];
    } else if (selectedGroup) {
      if (groupUsers.length === 0)
        return showPostError("No users found in selected group.");
      targetUsers = groupUsers;
    }

    // Deduplicate permission rows before building the final payload
    const map = new Map();
    droppedItems.forEach((row) => {
      const key = `${row.moduleId}-${row.mainId}-${row.itemId}-${row.subId}-${row.actionId}`;
      map.set(key, row);
    });
    const uniquePermissions = Array.from(map.values());

    // Build a flat payload array covering all target users and unique permissions
    const payload = [];
    targetUsers.forEach((user) => {
      uniquePermissions.forEach((row) => {
        payload.push({
          MODULE_MENU_ID: normDb(row.moduleId),
          MAIN_MENU_ID: normDb(row.mainId),
          MENU_ITEM_ID: normDb(row.itemId),
          SUB_MENU_ITEM_ID: normDb(row.subId),
          ACTION_ID: normDb(row.actionId),
          USER_ID: normDb(user.USER_ID || user.id),
        });
      });
    });

    try {
      await postUsers_Drag(payload);
      showPostSuccess(
        selectedUser
          ? `Permissions updated for ${selectedUser.name}.`
          : `Permissions applied to ${groupUsers.length} users in "${selectedGroup.GROUP_NAME}".`,
      );
    } catch (error) {
      console.error(error);
      showPostError("Failed to update permissions.");
    }
  };

  // Prompts for confirmation, then deletes a specific dropped item row
  // for all target users (single user or entire group).
  const handleDelete = async (idx) => {
    const res = await deleteAlert();
    if (!res.isConfirmed) return;

    const row = droppedItems[idx];

    // Determine the list of target users for the delete operation
    let targetUsers = [];

    if (selectedUser) {
      targetUsers = [{ USER_ID: selectedUser.id }];
    } else if (selectedGroup) {
      if (groupUsers.length === 0) {
        return deleteErrorAlert("No users found in selected group.");
      }
      targetUsers = groupUsers;
    } else {
      return deleteErrorAlert("Please select a user or a group.");
    }

    try {
      // Execute the delete request for every target user
      for (const user of targetUsers) {
        const payload = {
          // Determine the deepest level of the row to target the correct record
          level: row.subId
            ? "sub"
            : row.itemId
              ? "item"
              : row.mainId
                ? "main"
                : "module",
          MODULE_MENU_ID: row.moduleId,
          MAIN_MENU_ID: row.mainId,
          MENU_ITEM_ID: row.itemId,
          SUB_MENU_ITEM_ID: row.subId,
          USER_ID: user.USER_ID,
        };

        const response = await deleteUsers_Drag(payload);
        if (response?.Status === 1) {
          showPostSuccess("Deleted successfully");
          setDroppedItems((prev) => prev.filter((_, i) => i !== idx));
        }
      }
    } catch (err) {
      console.error(err);
      deleteErrorAlert("Failed to delete");
    }
  };

  // Ref used to track when the drop zone has been manually cleared,
  // allowing consumers or child components to react to a reset event.
  const dropResetRef = useRef(false);

  // Resets all selections and clears the dropped items table.
  const ClearDetails = () => {
    setDroppedItems([]);
    setSelectedUser(null);
    setSelectedGroup(null);
    setGroupUsers([]);
    dropResetRef.current = true;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        {/* Left panel: user/group selection dropdowns and the drag-and-drop target zone */}
        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
          {/* User selection autocomplete */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography fontWeight="bold">Select User</Typography>
            <Autocomplete
              options={users}
              value={selectedUser}
              disabled={Boolean(selectedGroup)}
              getOptionLabel={(option) => option?.name ?? ""}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              onChange={(e, value) => setSelectedUser(value)}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} label="Search User" />
              )}
            />
          </Paper>

          {/* Group selection autocomplete with a button to preview group members */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography fontWeight="bold">Select Group</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Autocomplete
                sx={{ width: "95%" }}
                options={groups}
                value={selectedGroup}
                disabled={Boolean(selectedUser)}
                getOptionLabel={(option) => option?.GROUP_NAME || ""}
                isOptionEqualToValue={(option, value) =>
                  option?.GROUP_ID === value?.GROUP_ID
                }
                onChange={(e, value) => setSelectedGroup(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Search Group" size="small" />
                )}
              />

              {/* Opens the modal to preview users in the selected group */}
              <Button
                sx={{ height: "35px" }}
                onClick={() => setOpen(true)}
                color="black"
              >
                <VisibilityIcon sx={{ borderColor: "black" }} />
              </Button>

              {/* Modal displaying the list of users belonging to the selected group */}
              <Modal
                open={open}
                onClose={() => setOpen(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Box sx={style}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6" fontWeight={600}>
                      Group List
                    </Typography>
                    <IconButton onClick={() => setOpen(false)} size="small">
                      <CloseIcon />
                    </IconButton>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Table listing all users in the selected group */}
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                      height: "220px",
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {selectedGroup?.GROUP_NAME}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupUsers.length > 0 ? (
                          groupUsers.map((user) => (
                            <TableRow key={user?.USER_ID} hover>
                              <TableCell>{user?.LOGIN_ID}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell align="center" sx={{ color: "gray" }}>
                              No users found for this group
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Modal>
            </Box>
          </Paper>

          {/* Drop zone where menu tree nodes can be dragged and dropped */}
          <Paper
            sx={{
              height: 295,
              border: "2px dashed #555",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Typography>Drag & Drop Menus</Typography>
          </Paper>
        </Grid>

        {/* Middle panel: permissions table showing dropped items with action radio buttons */}
        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
          <TableContainer component={Paper} sx={{ height: 508 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Details</strong>
                  </TableCell>
                  <TableCell>
                    <strong>UI Privileges</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Delete</strong>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {droppedItems.map((i, idx) => (
                  <TableRow key={getUniqueKey(i)}>
                    {/* Breadcrumb path from module down to the deepest assigned level */}
                    <TableCell>
                      {[i?.moduleName, i?.mainName, i?.itemName, i?.subName]
                        .filter(Boolean)
                        .join(" → ")}
                    </TableCell>

                    {/* Radio buttons for selecting a UI privilege action for this row */}
                    <TableCell>
                      <RadioGroup
                        row
                        value={i.actionId != null ? String(i.actionId) : ""}
                        onChange={(e) =>
                          handleActionChange(idx, e.target.value)
                        }
                      >
                        {userActions.map((act) => (
                          <FormControlLabel
                            key={`row-${idx}-act-${act.id}`}
                            value={String(act.id)}
                            control={<Radio size="small" />}
                            label={<Chip label={act.name} size="small" />}
                          />
                        ))}
                      </RadioGroup>
                    </TableCell>

                    <TableCell>
                      <Button
                        color="error"
                        variant="contained"
                        onClick={() => handleDelete(idx)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Right panel: live tree view reflecting the current dropped permissions structure */}
        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
          <Paper sx={{ p: 2, height: 508, overflow: "auto" }}>
            {Object.values(buildTree()).map((node) => (
              <TreeNode key={node.id} node={node} />
            ))}
          </Paper>
        </Grid>

        {/* Action buttons to submit the permissions payload or reset the form */}
        <Grid
          size={{ xs: 12, md: 9, lg: 9 }}
          sx={{ display: "flex", justifyContent: "flex-end" }}
          gap={2}
        >
          <Button color="primary" variant="contained" onClick={postData}>
            POST
          </Button>
          <Button variant="contained" color="error" onClick={ClearDetails}>
            CLEAR
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DragAndDrop;
