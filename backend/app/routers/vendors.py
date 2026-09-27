from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database import get_db
from app.models.vendors import Vendor
from app.schemas.vendors import VendorCreate, VendorResponse

router = APIRouter()

@router.post("/", response_model=VendorResponse)
async def create_vendor(vendor_in: VendorCreate, db: AsyncSession = Depends(get_db)):
    db_vendor = Vendor(**vendor_in.model_dump())
    db.add(db_vendor)
    await db.commit()
    await db.refresh(db_vendor)
    return db_vendor

@router.get("/", response_model=List[VendorResponse])
async def list_vendors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vendor))
    return result.scalars().all()

@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(vendor_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor
