import { useBroadcastEvent, useEventListener, useMyPresence, useOthers } from "@/liveblocks.config"
import LiveCursors from "./cursor/LiveCursors"
import { useCallback, useState } from "react";
import CursorChat from "./cursor/CursorChat";
import { CursorMode, CursorState, Reaction, ReactionEvent } from "@/types/type";
import { useEffect } from "react";
import ReactionSelector from "./reaction/ReactionButton";
import FlyingReaction from "./reaction/FlyingReaction";
import useInterval from "@/hooks/useInterval";
import { Comments } from "./comments/Comments";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { shortcuts } from "@/constants";


type Props = {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  undo: () => void;
  redo: () => void;
}

const Live = ({canvasRef, undo, redo}: Props) => {
    const others = useOthers();
    const [ { cursor }, updateMyPresence ] = useMyPresence() as any;
    const broadcast = useBroadcastEvent();
    const [cursorState, setCursorState] = useState<CursorState>({
        mode: CursorMode.Hidden,
    })

    const [reactions, setReactions] = useState<Reaction[]>([])

    const setReaction = useCallback((reaction: string) => {
      setCursorState({
        mode: CursorMode.Reaction,
        reaction, isPressed: false
      })
    }, [])

    const handleContextMenuClick = useCallback((key : string) => {
      switch (key) {
        case 'Chat':
          setCursorState({
            mode: CursorMode.Chat,
            previousMessage: null,
            message: '',
          })
          break;
        case 'Undo':
          undo();
          break;
        case 'Redo':
          redo();
          break;
        case 'Reactions':
          setCursorState({
            mode: CursorMode.ReactionSelector,
          })
        default:
          break;
          
      }
    }, [])

    //clear them from the state after every second
    useInterval(() => {
      setReactions((reactions) => reactions.filter((reaction) => reaction.timestamp > Date.now() - 4000));
    }, 1000);

    useInterval(() => {
      if (cursorState.mode === CursorMode.Reaction && cursorState.isPressed && cursor) {
        setReactions((reactions) =>
          reactions.concat([
            {
              point: { x: cursor.x, y: cursor.y },
              value: cursorState.reaction,
              timestamp: Date.now(),
            },
          ])
        );
  
        broadcast({
          x: cursor.x,
          y: cursor.y,
          value: cursorState.reaction,
        });
      }
    }, 100);

    useEventListener((eventData) => {
      const event = eventData.event as ReactionEvent;

      setReactions((reactions) => reactions.concat([
        {
          point:{x: event.x, y: event.y},
          value: event.value,
          timestamp: Date.now(),
        },
      ]))
    })

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        e.preventDefault();

        if(cursor == null || cursorState.mode !== CursorMode.ReactionSelector){
          const x = e.clientX - e.currentTarget.getBoundingClientRect().x;
          const y = e.clientY - e.currentTarget.getBoundingClientRect().y;

          updateMyPresence({ cursor: {x,y} });
        }
    }, []);

    const handlePointerLeave = useCallback((e: React.PointerEvent) => {
        setCursorState({mode: CursorMode.Hidden})

        updateMyPresence({ cursor: null, message: null});
    }, [cursorState.mode, setCursorState]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
      setCursorState((state: CursorState) => 
          cursorState.mode === CursorMode.Reaction ? 
          {...state, isPressed: true} : state 
        );
    }, [cursorState.mode, setCursorState]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        const x = e.clientX - e.currentTarget.getBoundingClientRect().x;
        const y = e.clientY - e.currentTarget.getBoundingClientRect().y;

        updateMyPresence({ cursor: {x,y} });

        setCursorState((state: CursorState) => 
          cursorState.mode === CursorMode.Reaction ? 
          {...state, isPressed: true} : state 
        );
    }, []);

    useEffect(() => {
        const onKeyUp = (e: KeyboardEvent) => {
          if (e.key === "/") {
            setCursorState({ 
                mode: CursorMode.Chat, 
                previousMessage: null, 
                message: "" 
            });
          } else if (e.key === "Escape") {
            updateMyPresence({ message: "" });
            setCursorState({ mode: CursorMode.Hidden });
          } else if (e.key === "e") {
            setCursorState({ mode: CursorMode.ReactionSelector });
          }        
        }
    
        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === "/") {
            e.preventDefault();
          }
        }
    
        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("keydown", onKeyDown);
    
        return () => {
          window.removeEventListener("keyup", onKeyUp);
          window.removeEventListener("keydown", onKeyDown);
        };
      }, [updateMyPresence]);
    
    return (
      <ContextMenu>
      <ContextMenuTrigger
        className="relative flex h-full w-full flex-1 items-center justify-center"
        id="canvas"
        style={{
          cursor: cursorState.mode === CursorMode.Chat ? "none" : "auto",
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >

            <canvas ref={canvasRef} />

            {reactions.map((r) => (
              <FlyingReaction
                key={r.timestamp.toString()}
                x={r.point.x}
                y={r.point.y}
                timestamp={r.timestamp}
                value={r.value}
              />
            ))}

            {cursor && (
                <CursorChat 
                    cursor = {cursor}
                    cursorState = {cursorState}
                    setCursorState = {setCursorState}
                    updateMyPresence = {updateMyPresence}
                />
            )}

            {cursorState.mode === CursorMode.ReactionSelector && (
              <ReactionSelector
                setReaction={setReaction}
              />
            )}

            <LiveCursors others = {others}/>

            <Comments />
        </ContextMenuTrigger>
        <ContextMenuContent className="right-menu-content">
          {shortcuts.map((item) => (
            <ContextMenuItem key={item.key}
              onClick={() => handleContextMenuClick(item.name)}
              className="right-menu-item"
            >
              <p>{item.name}</p>
              <p className="text-xs text-primary-grey-300">{item.shortcut}</p>
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
        </ContextMenu>
  )
}

export default Live