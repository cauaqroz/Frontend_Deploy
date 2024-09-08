import React from 'react';
import '../styles/Skeleton.css';

const Skeleton = ({ type, page }) => {
  const classes = `skeleton ${page ? `${page}-${type}` : ''}`;
  return <div className={classes}></div>;
};

export default Skeleton;