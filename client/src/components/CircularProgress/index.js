import React from "react";
import loader from "../../assets/images/ElsnerElevate.svg"

const CircularProgress = ({className}) => <div className={`loader ${className}`}>
  <img className="loader-img" src={loader} alt="loader"/>
</div>;
export default CircularProgress;
