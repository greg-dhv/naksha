from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from database import db
from routers.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


class SaveChartRequest(BaseModel):
    chart_data: dict
    birth_data: dict


@router.get("/chart")
def get_chart(current_user: dict = Depends(get_current_user)):
    chart_data = current_user.get("chart_data")
    if not chart_data:
        raise HTTPException(status_code=404, detail="No chart found")
    return chart_data


@router.post("/chart")
def save_chart(body: SaveChartRequest, current_user: dict = Depends(get_current_user)):
    db.table("users").update({
        "chart_data": body.chart_data,
        "birth_data": body.birth_data,
    }).eq("id", current_user["id"]).execute()
    return {"success": True}


@router.delete("/me")
def delete_account(current_user: dict = Depends(get_current_user)):
    db.table("messages").delete().eq("user_id", current_user["id"]).execute()
    db.table("bonds").delete().or_(f"user_id_1.eq.{current_user['id']},user_id_2.eq.{current_user['id']}").execute()
    db.table("users").delete().eq("id", current_user["id"]).execute()
    return {"success": True}


@router.get("/search")
def search_users(q: str, current_user: dict = Depends(get_current_user)):
    term = q.lstrip("@").lower().strip()
    if len(term) < 2:
        return []
    result = db.table("users").select("id, username, chart_data").ilike("username", f"%{term}%").limit(10).execute()
    return [
        {"id": u["id"], "username": u["username"], "has_chart": u.get("chart_data") is not None}
        for u in result.data
        if u["id"] != current_user["id"]
    ]
