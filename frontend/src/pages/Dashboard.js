import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxOpen, FaTruck, FaUserTie, FaTools, FaPowerOff
} from "react-icons/fa";
import {
  MdFastfood, MdAttachMoney, MdCancel, MdMoneyOff
} from "react-icons/md";
import { RiHistoryLine } from "react-icons/ri";
import { TbTruckDelivery } from "react-icons/tb";
import {
  BiMoneyWithdraw, BiLogIn, BiLogOut
} from "react-icons/bi";
import { GiReceiveMoney } from "react-icons/gi";
import { VscFolderActive } from "react-icons/vsc";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const handleNav = (path, state) => {
    if (state) {
      navigate(path, { state });
    } else {
      navigate(path);
    }
  };


  const buttons = [
    { label: "PICK UP", path: "/order/info", color: "green", icon: <FaBoxOpen size={28} />, state: { orderType: "pickup" } },
    { label: "TO GO", path: "/order/info", color: "green", icon: <MdFastfood size={28} />, state: { orderType: "to-go" } },
    { label: "DELIVERY", path: "/order/info", color: "green", icon: <FaTruck size={28} />, state: { orderType: "delivery" } },

    { label: "Recall", path: "/recall", color: "green", icon: <RiHistoryLine size={28} /> },

    { label: "Driver", path: "/assign", color: "blue", icon: <FaUserTie size={28} /> },
    { label: "Delivery Status", path: "/delivery-status", color: "blue", icon: <TbTruckDelivery size={28} /> },

    { label: "Void", path: "/void", color: "orange", icon: <MdCancel size={28} /> },
    { label: "Settle", path: "/settle", color: "orange", icon: <MdAttachMoney size={28} /> },
    { label: "Refund", path: "#", color: "orange", icon: <BiMoneyWithdraw size={28} /> },
    { label: "Pay Out", path: "#", color: "orange", icon: <GiReceiveMoney size={28} /> },

    { label: "Operations", path: "/operations", color: "purple", icon: <FaTools size={28} /> },
    { label: "Back Office", path: "/backoffice", color: "purple", icon: <VscFolderActive size={28} /> },

    { label: "No Sale", path: "#", color: "gray", icon: <MdMoneyOff size={28} /> },
    { label: "Cashier In", path: "#", color: "gray", icon: <BiLogIn size={28} /> },
    { label: "Cashier Out", path: "#", color: "gray", icon: <BiLogOut size={28} /> },

    { label: "Exit Program", path: "#", color: "red", icon: <FaPowerOff size={28} /> }
  ];


  return (
    <div className="dashboard">
      <h1>Aldelo POS – Lite Edition</h1>
      <div className="button-grid">
        {buttons.map((btn, index) => (
          <button
            key={index}
            className={`dashboard-button ${btn.color}`}
            onClick={() => btn.path !== "#" && handleNav(btn.path, btn.state)}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {btn.icon}
              <span style={{ marginTop: "8px" }}>{btn.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
