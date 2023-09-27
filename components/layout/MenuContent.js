import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import PropTypes from 'prop-types';
import { Menu } from 'antd';
import * as AntdIcons from '@ant-design/icons';
import ThemeActions from 'stores/Theme/Actions';
import MenuConstant from 'constants/MenuConstant.json';

const { SubMenu } = Menu;

const setDefaultOpen = (key) => {
  const keyList = [];
  let keyString = '';

  if (key) {
    const arr = key.split('/');

    for (let index = 0; index < arr.length; index += 1) {
      const elm = arr[index];
      keyString = index === 0 ? elm : `${keyString}/${elm}`;
      keyList.push(keyString);
    }
  }

  return keyList;
};

const getRootSubMenu = (menu) => {
  const rootSubMenu = [];

  menu?.map((group) => {
    return group?.sub_menu?.map((submenu) => {
      return rootSubMenu.push(submenu.url);
    });
  });

  return rootSubMenu;
};

function MenuContent({ routeInfo }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { mobileNav } = useSelector((state) => state.theme);
  const menu = MenuConstant;
  const [currentSubMenu, setCurrentSubMenu] = useState(setDefaultOpen(routeInfo?.url));

  const onSelect = () => {
    if (mobileNav) {
      dispatch(ThemeActions.toggleMobileNav(false));
    }
  };

  const onOpenChange = (keys) => {
    const rootSubmenuKeys = getRootSubMenu(menu);
    const latestOpenKey = keys.find((key) => currentSubMenu.indexOf(key) === -1);

    if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      setCurrentSubMenu(keys);
    } else {
      setCurrentSubMenu(latestOpenKey ? [latestOpenKey] : []);
    }
  };

  return (
    <Menu
      mode='inline'
      inlineIndent={22}
      onSelect={onSelect}
      openKeys={currentSubMenu}
      onOpenChange={onOpenChange}
      defaultSelectedKeys={[routeInfo?.url]}
      className='h-100 border-0'
    >
      {menu.map((item) => (
        item.sub_menu.length > 0 ? (
          <Menu.ItemGroup key={item.url} title={t(item.name)}>
            {item.sub_menu.map((subMenuFirst) => (
              subMenuFirst.sub_menu.length > 0 ? (
                <SubMenu
                  key={subMenuFirst.url}
                  title={t(subMenuFirst.name)}
                  icon={subMenuFirst.icon && React.createElement(AntdIcons[subMenuFirst.icon])}
                >
                  {subMenuFirst.sub_menu.map((subMenuSecond) => (
                    <Menu.Item
                      key={subMenuSecond.url}
                      icon={subMenuSecond.icon && React.createElement(AntdIcons[subMenuSecond.icon])}
                    >
                      <Link legacyBehavior href={subMenuSecond.url}>
                        <a>
                          {t(subMenuSecond.name)}
                        </a>
                      </Link>
                    </Menu.Item>
                  ))}
                </SubMenu>
              ) : (
                <Menu.Item
                  key={subMenuFirst.url}
                  icon={subMenuFirst.icon && React.createElement(AntdIcons[subMenuFirst.icon])}
                >
                  <Link legacyBehavior href={subMenuFirst.url}>
                    <a>
                      {t(subMenuFirst.name)}
                    </a>
                  </Link>
                </Menu.Item>
              )
            ))}
          </Menu.ItemGroup>
        ) : (
          <Menu.Item key={item.url} icon={item.icon || null}>
            <Link legacyBehavior href={item.url}>
              <a>
                {t(item.name)}
              </a>
            </Link>
          </Menu.Item>
        )
      ))}
    </Menu>
  );
}

MenuContent.propTypes = {
  routeInfo: PropTypes.objectOf(PropTypes.any),
};

MenuContent.defaultProps = {
  routeInfo: {},
};

export default MenuContent;