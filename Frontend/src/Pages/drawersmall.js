import * as React from "react";
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
  styled
} from "@mui/material";

import MuiDrawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import EnhancedEncryptionIcon from "@mui/icons-material/EnhancedEncryption";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EventIcon from "@mui/icons-material/Event";
import PeopleIcon from "@mui/icons-material/People";
import NotificationsPausedIcon from '@mui/icons-material/NotificationsPaused';
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SettingsIcon from "@mui/icons-material/Settings";
import AssignmentIcon from "@mui/icons-material/Assignment";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import WorkIcon from "@mui/icons-material/Work";
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import ListAltIcon from "@mui/icons-material/ListAlt";
import Diversity3Icon from '@mui/icons-material/Diversity3';
import theme from '../utils/drawer.theme'
import { Outlet, useNavigate } from "react-router";
import { useColorScheme } from "@mui/material/styles";

// Drawer Width
const drawerWidth = 240;

/* Drawer Mixins */
const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width"),
  overflowX: "hidden",
  borderRadius: "0 16px 16px 0",
  backgroundColor: theme.palette.background.paper,
  borderRight: "none",
  boxShadow: theme.shadows[4],
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width"),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  borderRadius: "0 16px 16px 0",
  backgroundColor: theme.palette.background.paper,
  borderRight: "none",
  boxShadow: theme.shadows[4],
});

/* Drawer Header */
const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

/* AppBar */
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  borderRadius: "0 0 16px 16px",
  background:
    theme.palette.mode === "light"
      ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
      : "#0d0d0d",
  color: theme.palette.mode === "light" ? "#fff" : theme.palette.text.primary,

  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
  }),
}));

/* Drawer */
const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  whiteSpace: "nowrap",

  ...(open
    ? { ...openedMixin(theme), "& .MuiDrawer-paper": openedMixin(theme) }
    : { ...closedMixin(theme), "& .MuiDrawer-paper": closedMixin(theme) }),
}));

/* 🔥 SMALL BUTTON STYLE */
const smallBtn = {
  py: 0.3,
  minHeight: 34,
  "& .MuiListItemIcon-root": {
    minWidth: 32,
  },
  "& .MuiListItemText-primary": {
    fontSize: "0.85rem",
  },
};

export default function MiniDrawer() {
  const navigate = useNavigate();
  const { mode, setMode } = useColorScheme();

  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(null);

  const [masterOpen, setMasterOpen] = React.useState(false);
  const [projectOpen, setProjectOpen] = React.useState(false);
  const [notificationOpen, setNotificationOpen] = React.useState(false);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const isMenuOpen = Boolean(anchorEl);

  /* Highlight Color */
  const highlight = (theme, index) =>
    activeIndex === index
      ? theme.palette.mode === "dark"
        ? "#333"
        : "#eee"
      : "transparent";

  return (
    <ThemeProvider theme={theme}>
      {!mode ? (
        <Box>Loading theme</Box>
      ) : (
        <>
          <CssBaseline />

          <Box sx={{ display: "flex", minHeight: "100vh" }}>

            {/* =================== APPBAR =================== */}
            <AppBar position="fixed" open={open}>
              <Toolbar>
                <IconButton color="inherit" onClick={() => setOpen(true)} edge="start">
                  <MenuIcon />
                </IconButton>

                <Typography
                  variant="h6"
                  sx={{ flexGrow: 1, cursor: "pointer" }}
                  onClick={() => navigate("/drawer")}
                >
                  Siri Workbench
                </Typography>

                <IconButton
                  onClick={() => setMode(mode === "light" ? "dark" : "light")}
                  color="inherit"
                >
                  {mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
                </IconButton>

                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit">
                  <Avatar />
                </IconButton>

                <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={() => setAnchorEl(null)}>
                  <MenuItem>
                    <EnhancedEncryptionIcon />
                    Change Password
                  </MenuItem>
                  <MenuItem onClick={() => navigate("/")}>
                    <ChevronRightIcon color="error" />
                    Logout
                  </MenuItem>
                </Menu>
              </Toolbar>
            </AppBar>

            {/* =================== DRAWER =================== */}
            <Drawer variant="permanent" open={open}>
              <DrawerHeader>
                <IconButton onClick={() => setOpen(false)}>
                  <ChevronLeftIcon />
                </IconButton>
              </DrawerHeader>

              <Divider />

              <List>

                {/* ADMIN DASHBOARD */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setActiveIndex(0);
                      navigate("/drawer");
                    }}
                    sx={(theme) => ({
                      backgroundColor: highlight(theme, 0),
                      ...smallBtn,
                    })}
                  >
                    <ListItemIcon>
                      <AdminPanelSettingsIcon sx={{ color: "#c19b00ff" }} />
                    </ListItemIcon>
                    <ListItemText primary="Admin Dashboard" />
                  </ListItemButton>
                </ListItem>

                {/* NEW TASK */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setActiveIndex(1);
                      navigate("Drawer/Newtask");
                    }}
                    sx={(theme) => ({
                      backgroundColor: highlight(theme, 1),
                      ...smallBtn,
                    })}
                  >
                    <ListItemIcon>
                      <PlaylistAddIcon sx={{ color: "#c19b00ff" }} />
                    </ListItemIcon>
                    <ListItemText primary="New Task" />
                  </ListItemButton>
                </ListItem>

                {/* USER CREATION */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setActiveIndex(2);
                      navigate("Drawer/UserCreation");
                    }}
                    sx={(theme) => ({
                      backgroundColor: highlight(theme, 2),
                      ...smallBtn,
                    })}
                  >
                    <ListItemIcon>
                      <GroupAddIcon sx={{ color: "#c19b00ff" }} />
                    </ListItemIcon>
                    <ListItemText primary="User Creation" />
                  </ListItemButton>
                </ListItem>

                {/* HOLIDAYS */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setActiveIndex(3);
                      navigate("Drawer/Holiday");
                    }}
                    sx={(theme) => ({
                      backgroundColor: highlight(theme, 3),
                      ...smallBtn,
                    })}
                  >
                    <ListItemIcon>
                      <EventIcon sx={{ color: "#c19b00ff" }} />
                    </ListItemIcon>
                    <ListItemText primary="Holidays" />
                  </ListItemButton>
                </ListItem>

                {/* EMPLOYEE */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setActiveIndex(4);
                      navigate("Drawer/Employee");
                    }}
                    sx={(theme) => ({
                      backgroundColor: highlight(theme, 4),
                      ...smallBtn,
                    })}
                  >
                    <ListItemIcon>
                      <PeopleIcon sx={{ color: "#c19b00ff" }} />
                    </ListItemIcon>
                    <ListItemText primary="Employee" />
                  </ListItemButton>
                </ListItem>

                {/* CUSTOMER */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setActiveIndex(5);
                      navigate("Drawer/Customer");
                    }}
                    sx={(theme) => ({
                      backgroundColor: highlight(theme, 5),
                      ...smallBtn,
                    })}
                  >
                    <ListItemIcon>
                      <PersonAddIcon sx={{ color: "#c19b00ff" }} />
                    </ListItemIcon>
                    <ListItemText primary="Customer" />
                  </ListItemButton>
                </ListItem>

                {/* MASTER */}
                <ListItemButton
                  onClick={() => {
                    setActiveIndex(6);
                    setMasterOpen(!masterOpen);
                  }}
                  sx={(theme) => ({
                    backgroundColor: highlight(theme, 6),
                    ...smallBtn,
                  })}
                >
                  <ListItemIcon>
                    <SettingsIcon sx={{ color: "#c19b00ff" }} />
                  </ListItemIcon>
                  <ListItemText primary="Master" />
                  {masterOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </ListItemButton>

                <Collapse in={masterOpen}>
                  <List sx={{ pl: 3 }}>
                    <ListItemButton
                      onClick={() => {
                        setActiveIndex(7);
                        navigate("Drawer/LeaveAllotment");
                      }}
                      sx={(theme) => ({
                        backgroundColor: highlight(theme, 7),
                        ...smallBtn,
                      })}
                    >
                      <ListItemIcon>
                        <AssignmentIcon sx={{ color: "#c19b00ff" }} />
                      </ListItemIcon>
                      <ListItemText primary="Leave Allotment" sx={{ ml: -2 }} />
                    </ListItemButton>
                  </List>
                </Collapse>

                {/* PROJECT */}
                <ListItemButton
                  onClick={() => {
                    setActiveIndex(8);
                    setProjectOpen(!projectOpen);
                  }}
                  sx={(theme) => ({
                    backgroundColor: highlight(theme, 8),
                    ...smallBtn,
                  })}
                >
                  <ListItemIcon>
                    <WorkIcon sx={{ color: "#c19b00ff" }} />
                  </ListItemIcon>
                  <ListItemText primary="Project" />
                  {projectOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </ListItemButton>

                <Collapse in={projectOpen}>
                  <List sx={{ pl: 3 }}>
                    <ListItemButton
                      onClick={() => {
                        setActiveIndex(9);
                        navigate("Drawer/Project");
                      }}
                      sx={(theme) => ({
                        backgroundColor: highlight(theme, 9),
                        ...smallBtn,
                      })}
                    >
                      <ListItemIcon>
                        <ListAltIcon sx={{ color: "#c19b00ff" }} />
                      </ListItemIcon>
                      <ListItemText primary="New Project" sx={{ ml: -2 }} />
                    </ListItemButton>

                    <ListItemButton
                      onClick={() => {
                        setActiveIndex(10);
                        navigate("Drawer/ProjectTeam");
                      }}
                      sx={(theme) => ({
                        backgroundColor: highlight(theme, 10),
                        ...smallBtn,
                      })}
                    >
                      <ListItemIcon>
                        <Diversity3Icon sx={{ color: "#c19b00ff" }} />
                      </ListItemIcon>
                      <ListItemText primary="Project Team" sx={{ ml: -2 }} />
                    </ListItemButton>
                  </List>
                </Collapse>

                {/* NOTIFICATION */}
                <ListItemButton
                  onClick={() => {
                    setActiveIndex(11);
                    setNotificationOpen(!notificationOpen);
                  }}
                  sx={(theme) => ({
                    backgroundColor: highlight(theme, 11),
                    ...smallBtn,
                  })}
                >
                  <ListItemIcon>
                    <NotificationsActiveIcon sx={{ color: "#c19b00ff" }} />
                  </ListItemIcon>
                  <ListItemText primary="Notification" />
                  {notificationOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </ListItemButton>

                <Collapse in={notificationOpen}>
                  <List sx={{ pl: 3 }}>
                    <ListItemButton
                      onClick={() => {
                        setActiveIndex(12);
                        navigate("Drawer/NotificationType");
                      }}
                      sx={(theme) => ({
                        backgroundColor: highlight(theme, 12),
                        ...smallBtn,
                      })}
                    >
                      <ListItemIcon>
                        <NotificationsIcon sx={{ color: "#c19b00ff" }} />
                      </ListItemIcon>
                      <ListItemText primary="Notification Type" sx={{ ml: -2 }} />
                    </ListItemButton>

                    <ListItemButton
                      onClick={() => {
                        setActiveIndex(13);
                        navigate("Drawer/GeneralNotification");
                      }}
                      sx={(theme) => ({
                        backgroundColor: highlight(theme, 13),
                        ...smallBtn,
                      })}
                    >
                      <ListItemIcon>
                        <NotificationsPausedIcon sx={{ color: "#c19b00ff" }} />
                      </ListItemIcon>
                      <ListItemText primary="General Notification" sx={{ ml: -2 }} />
                    </ListItemButton>

                    <ListItemButton
                      onClick={() => {
                        setActiveIndex(14);
                        navigate("Drawer/NotificationTeam");
                      }}
                      sx={(theme) => ({
                        backgroundColor: highlight(theme, 14),
                        ...smallBtn,
                      })}
                    >
                      <ListItemIcon>
                        <NotificationImportantIcon sx={{ color: "#c19b00ff" }} />
                      </ListItemIcon>
                      <ListItemText primary="Notification Team" sx={{ ml: -2 }} />
                    </ListItemButton>
                  </List>
                </Collapse>

              </List>
            </Drawer>

            {/* MAIN CONTENT AREA */}
            <Box component="main" sx={{ flexGrow: 1, p: 2, width: "80%" }}>
              <DrawerHeader />
              <Outlet />
            </Box>
          </Box>
        </>
      )}
    </ThemeProvider>
  );
}
