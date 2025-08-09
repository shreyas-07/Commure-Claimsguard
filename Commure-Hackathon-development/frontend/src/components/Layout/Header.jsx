import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';
import './Header.css';

const Header = () => (
  <header className="header">
    <div className="header__content">
      <FaShieldAlt className="header__logo" />
      <span className="header__title">
        ClaimsGuard.Ai
      </span>
    </div>
  </header>
);

export default Header;
