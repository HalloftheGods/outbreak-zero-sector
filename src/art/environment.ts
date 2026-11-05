// The world: ground tiles, street props, vehicles and buildings.
// A prop's anchor is the bottom centre of its PROP_DEFS footprint; art may rise above it.

import type { EnvironmentArt } from './types.ts';
import { buildBrickApartment, buildSlabApartment } from './environment/apartment.ts';
import { buildClinic } from './environment/clinic.ts';
import { buildDiner } from './environment/diner.ts';
import { buildInterior } from './environment/floors.ts';
import { buildBed, buildCounter, buildLocker, buildShelf, buildSofa, buildTable, buildWorkbench } from './environment/furniture.ts';
import { buildGarage } from './environment/garage.ts';
import { buildGrocery } from './environment/grocery.ts';
import { buildGunShop } from './environment/gun-shop.ts';
import { buildBungalow, buildGableHouse, buildHipHouse } from './environment/house.ts';
import { buildBush, buildRubble, buildTree } from './environment/nature.ts';
import { buildPharmacy } from './environment/pharmacy.ts';
import { buildPolice } from './environment/police.ts';
import {
  buildBarrelFire,
  buildBarrier,
  buildCrates,
  buildDumpster,
  buildFireBarrel,
  buildHydrant,
  buildSandbags,
  buildStreetLamp,
} from './environment/street.ts';
import { buildTiles } from './environment/tiles.ts';
import { buildSedanH, buildSedanV, buildVan, buildWreckH } from './environment/vehicles.ts';
import { buildBrickWarehouse, buildSteelWarehouse } from './environment/warehouse.ts';
import { buildFenceH, buildFenceV, buildGasPump } from './environment/yard.ts';

export function buildEnvironment(): EnvironmentArt {
  return {
    tiles: buildTiles(),
    props: {
      car_sedan_h: buildSedanH(),
      car_sedan_v: buildSedanV(),
      car_wreck_h: buildWreckH(),
      van_h: buildVan(),
      dumpster: buildDumpster(),
      crate_stack: buildCrates(),
      barrier: buildBarrier(),
      sandbags: buildSandbags(),
      tree: buildTree(),
      fire_barrel: buildFireBarrel(),
      street_lamp: buildStreetLamp(),
      hydrant: buildHydrant(),
      bush: buildBush(),
      rubble: buildRubble(),
      fence_h: buildFenceH(),
      fence_v: buildFenceV(),
      gas_pump: buildGasPump(),
      shelf: buildShelf(),
      counter: buildCounter(),
      table: buildTable(),
      sofa: buildSofa(),
      bed: buildBed(),
      locker: buildLocker(),
      workbench: buildWorkbench(),
    },
    buildings: {
      pharmacy: [buildPharmacy()],
      clinic: [buildClinic()],
      police: [buildPolice()],
      gun_shop: [buildGunShop()],
      grocery: [buildGrocery()],
      diner: [buildDiner()],
      garage: [buildGarage()],
      warehouse: [buildSteelWarehouse(), buildBrickWarehouse()],
      house: [buildHipHouse(), buildGableHouse(), buildBungalow()],
      apartment: [buildBrickApartment(), buildSlabApartment()],
    },
    interior: buildInterior(),
    barrelFire: buildBarrelFire(),
  };
}
