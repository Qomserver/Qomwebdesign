from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..deps import get_current_user
from ..db import get_db
from ..models import Task, User
from ..schemas import TaskCreate, TaskRead, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskRead])
def list_tasks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.owner_id == current_user.id).order_by(Task.created_at.desc()).all()
    return tasks


@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = Task(owner_id=current_user.id, title=payload.title, description=payload.description)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskRead)
def get_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    patch: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if patch.title is not None:
        task.title = patch.title
    if patch.description is not None:
        task.description = patch.description
    if patch.is_done is not None:
        task.is_done = patch.is_done

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    db.delete(task)
    db.commit()
    return None