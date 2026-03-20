import {useLoaderData} from "react-router-dom"

export default function Home(){
    const posts = useLoaderData();

    return(
        <main className="flex items-center justify-center flex-col min-h-screen gap-4">
            {posts.map((elem, ind)=>(
                <div className="flex justify-center items-center w-20 h-20 bg-amber-600 rounded-4xl shadow-2xl" key={ind}>
                    {elem.name}
                </div>
                ))}
        </main>
    );
}