import clsx from "clsx"

type Props = {
  character: string
  className?: string
}

const CharacterSprite = ({ character, className }: Props) => (
  <div
    role="img"
    aria-label={character.replace("_", " ")}
    className={clsx("character-sprite aspect-square", className)}
    style={{ backgroundImage: `url(/characters/${character}.png)` }}
  />
)

export default CharacterSprite
