import { NextResponse } from "next/server"
import db from "@/lib/db"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await req.json()
    
    const updated = await db.accountsReceivable.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar conta a receber" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    await db.accountsReceivable.delete({ where: { id } })

    return NextResponse.json({ message: "Conta a receber deletada com sucesso" }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao deletar conta a receber" }, { status: 500 })
  }
}