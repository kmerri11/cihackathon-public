import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useAppContext } from "../libs/contextLib";
import { API, Logger } from "aws-amplify";
import Container from "../components/Container";
import ReactLoading from "react-loading";
import LoaderButton from "../components/LoaderButton";
import ReactPlayer from "react-player";
import ProgressBar from "react-customizable-progressbar";
import config from "../config";

const logger = new Logger("Round2Entry", "DEBUG");

function Round2(props) {
  const history = useHistory();
  const [value, setValue] = useState(1);
  const [setId, setSetId] = useState();
  const [pairId, setPairId] = useState();
  const [pair, setPair] = useState();
  const [total_entries, setTotal] = useState();
  const [total_completed, setTotalCompleted] = useState(0);
  const [current_position, setPosition] = useState(0);
  const [thankyou, setThankyou] = useState(false);
  const [alldone, setAllDone] = useState(false);
  const [playSecond, setPlaySecond] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticating, isAuthenticated } = useAppContext();

  useEffect(() => {
    async function onLoad() {
      try {
        var result = await loadEntry();
        //logger.debug(result);
        if (result.previous_sets) setTotalCompleted(result.previous_sets - 1);
        if (result.current_position) setPosition(result.current_position);
        if (result.total_entries) setTotal(result.total_entries);
        // Setup pairs
        if (result.setId) setSetId(result.setId);
        if (result.pair) setPair(result.pair);
        if (result.pairId) setPairId(result.pairId);
      } catch (e) {
        logger.debug(e);
      }
      setIsLoading(false);
    }

    if (!isAuthenticating && !isAuthenticated) {
      logger.debug("User is not authenticated");
      props.history.push("/login");
    }
    if (!isAuthenticating && isAuthenticated && isLoading) {
      onLoad();
    }
  }, [isAuthenticating, isAuthenticated, isLoading, thankyou, props.history]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await submitScore(value);
      var result = await loadEntry();
      setPosition(result.current_position);
      setTotal(result.total_entries);
      if (result.current_position === result.total_entries) {
        setTotalCompleted(total_completed + 1);
        setThankyou(true);
      }
      if (result.pair && result.current_position <= result.total_entries)
        setSetId(result.setId);
      setPair(result.pair);
      setPairId(result.pairId);
      history.push("/round2");
    } catch (e) {
      logger.debug("Error in addScore: " + e);
    }
    setIsSubmitting(false);
  }

  async function handleAssignment(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setThankyou(false);
    try {
      var result = await assignSet();
      console.log(result);
      if ('setId' in result) {
        setPosition(result.current_position);
        setTotal(result.total_entries);
        // Setup pairs
        if (result.pair && result.current_position <= result.total_entries)
          setSetId(result.setId);
        setPair(result.pair);
        setPairId(result.pairId);
      } else {
        setAllDone(true);
      }
      history.push("/round2");
    } catch (e) {
      logger.debug("Error in set assignment: " + e);
    }
    setIsSubmitting(false);
  }

  function loadEntry() {
    logger.debug("API: load round2 entry");
    return API.get("algorithms", `/round2`);
  }

  function assignSet() {
    logger.debug("API: fetch another round2 set");
    return API.get("algorithms", `/round2/assign`);
  }

  function submitScore(score) {
    let body = {
      setId: setId,
      pairId: pairId,
      score: value,
      algorithmId: pair.team0_algorithmId,
    };
    logger.debug(
      `API: round2/score setId=${setId} pairId=${pairId} score=${score}`
    );
    return API.post("algorithms", "/round2/score", { body });
  }

  function renderThankYou() {
    if (thankyou) return <h3>Set completed. Thank you!</h3>;
    if (alldone)
      return (
        <h3>
          All sets have been judged and Round 2 is complete.
          <br />
          Thank you!
        </h3>
      );
  }

  return (
    <Container>
      {isLoading ? (
        <>
          <ReactLoading type={"spin"} color={"#5d9cec"} />
        </>
      ) : (
        <>
          {(current_position === total_entries || !pair) && !isSubmitting && (
            <>
              {/* <div className="alert alert-dismissible alert-primary">
                <button type="button" className="close" data-dismiss="alert">
                  &times;
                </button>
                <h4 className="alert-heading">Heads up!</h4>
                <p className="mb-0">
                  This is a simulation of Round 1 judging for testing. Scores
                  will not persist.
                </p>
              </div> */}
              <h3>Round 2 Judging</h3>
              <div className="row justify-content-md-center">
                <div className="col-md-auto">
                  {renderThankYou()}
                  <p className="lead">
                    Number of rounds completed: {total_completed}
                  </p>
                  {!alldone && (
                    <form onSubmit={handleAssignment}>
                      <LoaderButton
                        block
                        type="submit"
                        bssize="large"
                        bsstyle="primary"
                        isLoading={isSubmitting}
                      >
                        Begin judging
                      </LoaderButton>
                    </form>
                  )}
                </div>
              </div>
            </>
          )}

          {current_position !== total_entries && pair && (
            <>
              <div className="row">
                <div className="col-md-auto">
                  <ProgressBar
                    radius={50}
                    progress={(current_position / total_entries) * 100}
                    strokeWidth={16}
                    strokeColor="#5d9cec"
                    strokeLinecap="round"
                    trackStrokeWidth={18}
                  >
                    <div className="indicator">
                      <div>
                        {current_position}/{total_entries}
                      </div>
                    </div>
                  </ProgressBar>
                </div>
                <div className="col-md-auto">
                  <h3>
                    Round 2 Judging -{" "}
                    {setId.slice(0, -2).replace(/_/g, " ").toUpperCase()}
                  </h3>
                  <p className="lead">Choose the best option of the two</p>
                  <p>Sets completed: {total_completed}</p>
                </div>
              </div>
              <br />
            </>
          )}

          {current_position < total_entries && pair && (
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-sm-6">
                  <div className="card mb-3">
                    <div className="card-body">
                      <ReactPlayer
                        controls
                        playing={true}
                        onEnded={() => setPlaySecond(true)}
                        width="100%"
                        height="48px"
                        url={
                          config.VOCODER_BUCKET_URL + pair.team0_vocoder_output
                        }
                      />
                    </div>
                    <div className="card-body">
                      <LoaderButton
                        block
                        type="submit"
                        //bsSize="large"
                        //bsStyle="primary"
                        isLoading={isSubmitting}
                        onClick={(changeEvent) => {
                          setValue(1);
                        }}
                      >
                        Option A is Better
                      </LoaderButton>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="card mb-3">
                    <div className="card-body">
                      <ReactPlayer
                        controls
                        playing={playSecond}
                        onEnded={() => setPlaySecond(false)}
                        width="100%"
                        height="48px"
                        url={
                          config.VOCODER_BUCKET_URL + pair.team1_vocoder_output
                        }
                      />
                    </div>
                    <div className="card-body">
                      <LoaderButton
                        block
                        type="submit"
                        //bsSize="large"
                        //bsStyle="primary"
                        isLoading={isSubmitting}
                        onClick={(changeEvent) => setValue(-1)}
                      >
                        Option B is Better
                      </LoaderButton>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </>
      )}
    </Container>
  );
}

export default Round2;
