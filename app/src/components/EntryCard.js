import React from "react";
import ReactAudioPlayer from "react-audio-player";
import Glyphicon from "@strongdm/glyphicon";
import { Button } from "react-bootstrap";
import "./LoaderButton.css";

export default function EntryCard({
  id,
  label,
  description,
  createdAt,
  vocoderOutputURL,
  vocoderStatus,
  ...props
}) {
  let border = id ? "card mb-3" : "card mb-3 border-primary";

  function VocoderStatus() {
    if (vocoderStatus !== "Successfully processed file") {
      return (
        <>
          <Glyphicon
            onClick={() => window.location.reload(false)}
            glyph="refresh"
            className="spinning"
          />
          &nbsp;&nbsp;{vocoderStatus}
        </>
      );
    } else {
      return (
        <>
          {vocoderStatus}
        </>
      );
    }
  }

  return (
    <>
      <div className={border}>
        <div className="card-body">
          <h5 className="card-title">{label}</h5>
          <h6 className="card-subtitle text-muted">{description}</h6>
        </div>

        {!id && (
          <div className="card-body">
            <Button variant="outline-primary" href={`/create/${label}`}>
              Upload Entry
            </Button>
          </div>
        )}

        {id && (
          <>
            <div className="card-body text-left">
              {vocoderOutputURL && (
                <>
                  <div className="col text-center">
                    <ReactAudioPlayer src={`${vocoderOutputURL}`} controls />
                  </div>
                  <hr />
                </>
              )}

              <div className="row no-gutters">
                <div className="col-8 align-bottom text-left">
                  <VocoderStatus />
                </div>
                <div className="col-4 text-right">
                  <Button variant="primary" href={`/entries/${id}`}>
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
