import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import "./index.css";
import FormContainer from "./components/Form/FormContainer";
import Profile from "./components/Profile/Profile";
import Dashboard from "./components/Profile/Dashboard/Dashboard";
import Transaction from "./components/Profile/Transaction/Transaction";
import Statistic from "./components/Profile/Statistic/Statistic";
import Wallet from "./components/Profile/Wallet/Wallet";
import {CardDataProvider} from "./context/CardDataContext";
import {ProfileDataProvider} from "./context/ProfileDataContext";

const router = createBrowserRouter([
    {
        path: "/",
        element: <FormContainer/>,
    },
    {
        path: "/profile",
        element: <Profile/>,
        children: [
            {
                path: "/profile/dashboard",
                element: <Dashboard/>,
            },
            {
                path: "/profile/transaction",
                element: <Transaction/>,
            },
            {
                path: "/profile/statistics",
                element: <Statistic/>,
            },
            {
                path: "/profile/wallet",
                element: <Wallet/>,
            },

        ]
    },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <CardDataProvider>
            <ProfileDataProvider>
                <RouterProvider router={router}/>
            </ProfileDataProvider>
        </CardDataProvider>
    </React.StrictMode>
);