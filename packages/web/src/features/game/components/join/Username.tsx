import { STATUS } from "@razzia/common/types/game/status"
import Button from "@razzia/web/components/Button"
import Card from "@razzia/web/components/Card"
import CharacterSprite from "@razzia/web/components/CharacterSprite"
import { CHARACTERS, type CharacterId } from "@razzia/common/constants"
import clsx from "clsx"
import Input from "@razzia/web/components/Input"
import { joinGame } from "@razzia/web/features/game/queries"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { createStatus } from "@razzia/web/features/game/utils/createStatus"
import { ApiError } from "@razzia/web/lib/api"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { StatusCodes } from "http-status-codes"
import { type KeyboardEvent, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const Username = () => {
  const { inviteCode, generatedUsernames, updatePlayer } = usePlayerStore()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [character, setCharacter] = useState<CharacterId | null>(null)
  const canSubmit = Boolean(character) && (generatedUsernames || username.trim().length > 0)
  const { t } = useTranslation()

  const { mutate: join, isPending } = useMutation({
    mutationFn: joinGame,
    onSuccess: ({ gameId, ticket, username: name }) => {
      localStorage.setItem("game_id", gameId)

      if (inviteCode) {
        localStorage.setItem("game_pin", inviteCode)
      }

      updatePlayer({
        gameId,
        joinTicket: ticket,
        player: name ? { username: name, points: 0 } : null,
        status: createStatus(STATUS.WAIT, { text: "game:waitingForPlayers" }),
      })
      navigate({ to: "/party/$gameId", params: { gameId } })
    },
    onError: (error) => {
      toast.error(
        t(error instanceof ApiError ? error.key : "errors:route.description"),
      )

      if (error instanceof ApiError && error.status === StatusCodes.NOT_FOUND) {
        updatePlayer({ inviteCode: null, generatedUsernames: false })
      }
    },
  })

  const handleLogin = () => {
    if (!inviteCode || !canSubmit || !character) {
      return
    }

    join({
      inviteCode,
      username: generatedUsernames ? undefined : username.trim(),
      character,
    })
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleLogin()
    }
  }

  const picker = (
    <div className="mt-4">
      <p className="mb-2 text-center font-semibold">Pick your character</p>
      <div className="grid grid-cols-2 gap-3">
        {CHARACTERS.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={character === id}
            onClick={() => setCharacter(id)}
            className={clsx(
              "flex flex-col items-center rounded-xl border-4 p-2 transition-all",
              character === id
                ? "border-primary bg-primary/15 scale-105 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300",
            )}
          >
            <CharacterSprite character={id} className="w-20 sm:w-24" />
            <span className="mt-1 text-sm font-bold">
              {id.replace("_", " ")}
            </span>
          </button>
        ))}
      </div>
    </div>
  )

  if (generatedUsernames) {
    return (
      <Card>
        <p className="mb-4 text-center text-lg font-semibold">
          {t("game:generatedUsernameNotice")}
        </p>
        {picker}
        {canSubmit && (
          <Button className="mt-4" onClick={handleLogin} disabled={isPending}>
            {t("common:submit")}
          </Button>
        )}
      </Card>
    )
  }

  return (
    <Card>
      <Input
        className="text-center"
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("game:usernamePlaceholder")}
      />
      {picker}
      {canSubmit && (
        <Button className="mt-4" onClick={handleLogin} disabled={isPending}>
          {t("common:submit")}
        </Button>
      )}
    </Card>
  )
}

export default Username
